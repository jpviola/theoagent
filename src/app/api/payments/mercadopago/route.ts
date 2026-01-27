import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// MercadoPago configuration for Argentina
const mercadopagoConfig = {
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  publicKey: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY!,
  isProduction: process.env.NODE_ENV === 'production'
};

// Initialize MercadoPago client
const client = new MercadoPagoConfig({ 
  accessToken: mercadopagoConfig.accessToken,
  options: { timeout: 5000 }
});

// Supabase client for donation persistence
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency = 'ARS', donor_email, donor_name, country = 'mla', metadata } = body;

    // console.log('🌎 MercadoPago payment request:', { amount, currency, donor_email, donor_name, country });

    // Enhanced validation
    if (!amount || amount <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid amount' 
      }, { status: 400 });
    }

    // Country-specific configuration
    const countryConfig = {
      'mla': { name: 'Argentina', currency: 'ARS', flag: '🇦🇷' },
      'mlb': { name: 'Brasil', currency: 'BRL', flag: '🇧🇷' },
      'mlm': { name: 'México', currency: 'MXN', flag: '🇲🇽' },
      'mco': { name: 'Colombia', currency: 'COP', flag: '🇨🇴' },
      'mpe': { name: 'Perú', currency: 'PEN', flag: '🇵🇪' },
      'mlu': { name: 'Uruguay', currency: 'UYU', flag: '🇺🇾' },
      'mlc': { name: 'Chile', currency: 'CLP', flag: '🇨🇱' }
    };

    const selectedCountry = countryConfig[country as keyof typeof countryConfig] || countryConfig.mla;

    // Create MercadoPago preference with enhanced fraud prevention
    const preference = new Preference(client);
    
    const preferenceData = {
      items: [
        {
          id: `santapalabra_donation_${country}_${Date.now()}`,
          title: `Donación a SantaPalabra ${selectedCountry.flag}`,
          description: `Apoyo para la evangelización digital en ${selectedCountry.name} y toda Hispanoamérica`,
          quantity: 1,
          unit_price: Number(amount),
          currency_id: selectedCountry.currency
        }
      ],
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/support?success=mercadopago&amount=${amount}&country=${country}`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/support?failure=mercadopago&country=${country}`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/support?pending=mercadopago&country=${country}`
      },
      auto_return: 'approved',
      external_reference: `santapalabra_${country}_${Date.now()}`,
      payer: {
        name: donor_name || `Donante ${selectedCountry.name}`,
        email: donor_email || undefined
      },
      statement_descriptor: 'SantaPalabra',
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      metadata: {
        country: selectedCountry.name,
        country_code: country,
        platform: 'SantaPalabra',
        purpose: 'donation',
        track_id: metadata?.track_id,
        track_title: metadata?.track_title,
        // Enhanced fraud prevention metadata
        user_agent: metadata?.user_agent || 'unknown',
        timestamp: metadata?.timestamp || new Date().toISOString(),
        source: metadata?.source || 'api_direct',
        sdk_version: 'v2'
      },
      // Additional security configurations
      binary_mode: false,
      taxes: [], // No taxes for donations
      shipments: {
        mode: 'not_specified' // Digital donation, no shipping
      }
    };

    // console.log('🔧 Creating MercadoPago preference for', selectedCountry.name, preferenceData);

    const result = await preference.create({ body: preferenceData });

    // console.log('✅ MercadoPago preference created:', result);

    // Create pending donation record
    const donationData = {
      payment_provider: 'mercadopago',
      amount_cents: Math.round(amount), // Already in cents from frontend
      currency: selectedCountry.currency,
      status: 'pending',
      donor_email: donor_email || null,
      donor_name: donor_name || null,
      // external_id: result.id, // Removed as column doesn't exist
      payment_id: result.id, // Using payment_id standard field for preference_id initially
      metadata: {
        preference_id: result.id,
        external_reference: preferenceData.external_reference,
        country: selectedCountry.name,
        country_code: country,
        platform: 'MercadoPago',
        sdk_version: 'server-side'
      }
    };

    // console.log('💾 Creating MercadoPago donation record:', donationData);

    const { data: donation, error: dbError } = await supabase
      .from('donations')
      .insert(donationData)
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    // console.log('✅ MercadoPago donation created:', donation);

    return NextResponse.json({ 
      success: true,
      preference: result,
      donation_id: donation.id,
      // Return the appropriate URL based on environment
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
      country: selectedCountry,
      message: `MercadoPago preference created successfully for ${selectedCountry.name}! ${selectedCountry.flag}`
    });

  } catch (error: any) {
    console.error('❌ MercadoPago error:', error);
    // Extract meaningful error message from MP response if available
    const message = error?.message || error?.cause?.description || 'Error creating MercadoPago preference';
    const details = error?.cause || error?.response?.data || error;
    
    return NextResponse.json(
      { 
        success: false, 
        error: message,
        details: details
      }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'MercadoPago API Ready - Multi-Country Support',
    supported_countries: {
      'mla': { name: 'Argentina', currency: 'ARS', flag: '🇦🇷' },
      'mlb': { name: 'Brasil', currency: 'BRL', flag: '🇧🇷' },
      'mlm': { name: 'México', currency: 'MXN', flag: '🇲🇽' },
      'mco': { name: 'Colombia', currency: 'COP', flag: '🇨🇴' },
      'mpe': { name: 'Perú', currency: 'PEN', flag: '🇵🇪' },
      'mlu': { name: 'Uruguay', currency: 'UYU', flag: '🇺🇾' },
      'mlc': { name: 'Chile', currency: 'CLP', flag: '🇨🇱' }
    },
    features: ['donations', 'preferences', 'webhooks', 'multi-country', 'client-server-side'],
    sdk_info: {
      client_side: 'MercadoPago.js',
      server_side: 'Node.js SDK',
      integration_type: 'Modern SDK approach'
    },
    note: 'Perfect for all Latin American users - SDKs client-side y server-side'
  });
}
