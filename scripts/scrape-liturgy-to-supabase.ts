
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing Supabase credentials in .env.local');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BASE_URL = 'https://liturgiadelashoras.github.io';
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function getMonthAbbr(monthIndex: number): string {
    return MONTHS[monthIndex];
}

function getDayPadded(day: number): string {
    return day.toString().padStart(2, '0');
}

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return response.text();
}

async function scrapeAndUpload() {
  console.log('Starting full year scraping to Supabase...');
  
  // Configure range: Scrape from today to end of 2026
  // Or maybe the whole year if needed. Let's do from today for now to save time, or configurable.
  const startDate = new Date('2026-01-01');
  const endDate = new Date('2026-12-31');
  
  let currentDate = new Date(startDate);
  
  let successCount = 0;
  let failCount = 0;

  while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const monthIdx = currentDate.getMonth();
      const day = currentDate.getDate();
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const monthStr = getMonthAbbr(monthIdx);
      const dayStr = getDayPadded(day);
      
      console.log(`Processing ${dateStr}...`);

      // 1. Find the daily index page
      const candidates = [
          `/sync/${year}/${monthStr}/${dayStr}.htm`,
          `/sync/${year}/${monthStr}/${dayStr}.html`,
          `/sync/${year}/${monthStr}/${dayStr}`
      ];

      let mainUrl = '';
      let mainHtml = '';
      let found = false;

      for (const pathSuffix of candidates) {
          const url = BASE_URL + pathSuffix;
          try {
              mainHtml = await fetchPage(url);
              mainUrl = url;
              found = true;
              break;
          } catch (e) {
              // continue
          }
      }

      if (!found) {
          console.warn(`  [MISSING] Could not find page for ${dateStr}`);
          failCount++;
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
      }

      // 2. Parse main page to find hours
      const $ = cheerio.load(mainHtml);
      const dayTitle = $('title').text().trim() || `${year}-${monthStr}-${dayStr}`;
      
      // Extract links to hours
      const hoursToScrape: { type: string, url: string }[] = [];
      const linkElements = $('a').toArray();

      for (const link of linkElements) {
          const href = $(link).attr('href');
          const text = $(link).text().trim().toLowerCase();
          
          if (href && !href.startsWith('http') && !href.startsWith('#')) {
              // Normalize hour type
              let type = 'unknown';
              if (text.includes('oficio')) type = 'oficio';
              else if (text.includes('laudes')) type = 'laudes';
              else if (text.includes('tercia')) type = 'tercia';
              else if (text.includes('sexta')) type = 'sexta';
              else if (text.includes('nona')) type = 'nona';
              else if (text.includes('vísperas') || text.includes('visperas')) type = 'visperas';
              else if (text.includes('completas')) type = 'completas';
              
              if (type !== 'unknown') {
                   // Construct sub-page URL
                   let subPageUrl = '';
                   if (mainUrl.endsWith('/')) {
                       subPageUrl = mainUrl + href;
                   } else {
                       subPageUrl = mainUrl + '/' + href;
                   }
                   hoursToScrape.push({ type, url: subPageUrl });
              }
          }
      }

      // 3. Scrape each hour and upload
      for (const hour of hoursToScrape) {
          try {
              // console.log(`    Scraping ${hour.type}...`);
              const hourHtml = await fetchPage(hour.url);
              const $hour = cheerio.load(hourHtml);
              
              // Cleanup
              $hour('script').remove();
              $hour('style').remove();
              $hour('a:contains("Volver")').remove(); // Remove navigation links
              $hour('div[align="right"]').remove(); // Remove font size controls if present
              
              const content = $hour('body').html() || '';
              const title = $hour('title').text().trim();

              // Upsert to Supabase
              const { error } = await supabase
                  .from('liturgy_hours')
                  .upsert({
                      date: dateStr,
                      hour_type: hour.type,
                      title: title || dayTitle,
                      content_html: content,
                      url: hour.url,
                      updated_at: new Date().toISOString()
                  }, {
                      onConflict: 'date,hour_type'
                  });

              if (error) {
                  if (error.message.includes('Could not find the table')) {
                      console.error(`\n[FATAL ERROR] Table 'liturgy_hours' does not exist in Supabase.`);
                      console.error(`Please go to your Supabase Dashboard -> SQL Editor and run the script found in:`);
                      console.error(`src/sql/liturgy_schema.sql`);
                      process.exit(1);
                  }
                  console.error(`    [DB ERROR] Failed to upsert ${hour.type}:`, error.message);
              } else {
                  // console.log(`    [SAVED] ${hour.type}`);
              }
              
              // Be nice to the server between requests
              await new Promise(r => setTimeout(r, 200));

          } catch (e) {
              console.error(`    [FETCH ERROR] Failed to scrape ${hour.type}:`, (e as Error).message);
          }
      }

      successCount++;
      currentDate.setDate(currentDate.getDate() + 1);
      
      // Be nice to the server between days
      await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\nFinished! Processed: ${successCount}, Failed: ${failCount}`);
}

scrapeAndUpload();
