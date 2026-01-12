import { getTheoAgentRAG, initializeWithCatholicDocuments } from './langchain-rag';
// import { getTheoAgentLlamaIndex, initializeLlamaIndexWithCatholicDocuments } from './llamaindex-rag';
import fs from 'fs/promises';
import path from 'path';

// Types
interface BenchmarkResult {
  implementation: 'LangChain' | 'LlamaIndex';
  query: string;
  response: string;
  responseTime: number;
  success: boolean;
  error?: string;
}

interface ComparisonReport {
  timestamp: Date;
  totalQueries: number;
  langchainResults: BenchmarkResult[];
  llamaindexResults: BenchmarkResult[];
  performance: {
    langchain: { avgTime: number; successRate: number };
    llamaindex: { avgTime: number; successRate: number };
  };
  qualityAssessment: {
    langchain: string[];
    llamaindex: string[];
  };
}

export class RAGComparison {
  private testQueries = [
    'What is the Catholic teaching on the Trinity?',
    'How should Catholics approach prayer?',
    'What is the significance of the Eucharist in Catholic doctrine?',
    'Can you explain the concept of salvation in Catholic theology?',
    'What does the Church teach about Mary, the Mother of God?',
    'How do Catholics understand the relationship between faith and reason?',
    'What is the role of the Pope in Catholic Church governance?',
    'How do Catholics interpret the Bible?',
    'What are the seven sacraments and their purposes?',
    'What is the Catholic position on social justice?'
  ];

  async loadTestDocuments() {
    const publicDir = path.join(process.cwd(), 'public', 'data');
    const documents = [];
    
    try {
      // Load sample documents for testing
      const catechismData = await fs.readFile(path.join(publicDir, 'catechism.json'), 'utf-8');
      const catechismEntries = JSON.parse(catechismData).slice(0, 50); // First 50 for testing
      
      documents.push(...catechismEntries.map((entry: any) => ({
        id: `catechism-${entry.id}`,
        title: `Catechism ${entry.id}`,
        content: entry.text,
        source: 'Catechism of the Catholic Church',
        category: 'catechism' as const
      })));

      // Load papal documents sample
      const papalData = await fs.readFile(path.join(publicDir, 'papal_magisterium.json'), 'utf-8');
      const papalEntries = JSON.parse(papalData).slice(0, 20);
      
      documents.push(...papalEntries.map((entry: any, index: number) => ({
        id: `papal-${index}`,
        title: entry.title || `Papal Document ${index}`,
        content: entry.content,
        source: entry.source || 'Papal Magisterium',
        category: 'papal' as const
      })));

      console.log(`📚 Loaded ${documents.length} test documents`);
      return documents;

    } catch (error) {
      console.error('❌ Failed to load test documents:', error);
      throw error;
    }
  }

  async benchmarkImplementation(
    implementation: 'LangChain' | 'LlamaIndex', 
    ragInstance: any,
    queries: string[]
  ): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];
    
    console.log(`🚀 Benchmarking ${implementation}...`);
    
    for (const query of queries) {
      console.log(`   Testing: "${query.substring(0, 50)}..."`);
      
      const startTime = Date.now();
      let success = true;
      let response = '';
      let error: string | undefined;

      try {
        response = await ragInstance.generateResponse(query, {
          userId: `test-${implementation.toLowerCase()}`,
          mode: 'standard' as const,
          language: 'en' as const
        });
      } catch (err) {
        success = false;
        error = err instanceof Error ? err.message : 'Unknown error';
        response = 'ERROR';
      }

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      results.push({
        implementation,
        query,
        response: response.substring(0, 500), // Truncate for storage
        responseTime,
        success,
        error
      });

      console.log(`   ${success ? '✅' : '❌'} ${responseTime}ms`);
    }

    return results;
  }

  async runFullComparison(): Promise<ComparisonReport> {
    console.log('🔄 Starting RAG Implementation Comparison...\n');

    // Load test documents
    const documents = await this.loadTestDocuments();

    // Initialize both implementations
    console.log('⚙️ Initializing LangChain RAG...');
    const langchainRAG = await initializeWithCatholicDocuments(documents);

    console.log('⚙️ LlamaIndex temporarily disabled...');
    let llamaIndexRAG: any = null;
    let llamaIndexAvailable = false;

    // LlamaIndex temporarily disabled
    // try {
    //   llamaIndexRAG = await initializeLlamaIndexWithCatholicDocuments(documents);
    // } catch (error) {
    //   console.warn('⚠️ LlamaIndex initialization failed (likely missing OpenAI key):', error);
    //   llamaIndexAvailable = false;
    // }

    // Run benchmarks
    const langchainResults = await this.benchmarkImplementation('LangChain', langchainRAG, this.testQueries);
    
    let llamaindexResults: BenchmarkResult[] = [];
    if (llamaIndexAvailable && llamaIndexRAG) {
      llamaindexResults = await this.benchmarkImplementation('LlamaIndex', llamaIndexRAG, this.testQueries);
    } else {
      console.log('⏭️ Skipping LlamaIndex benchmark due to initialization failure');
    }

    // Calculate performance metrics
    const langchainPerf = this.calculatePerformanceMetrics(langchainResults);
    const llamaindexPerf = llamaIndexAvailable ? this.calculatePerformanceMetrics(llamaindexResults) : 
                           { avgTime: 0, successRate: 0 };

    // Generate quality assessment
    const langchainQuality = this.assessResponseQuality(langchainResults);
    const llamaindexQuality = llamaIndexAvailable ? this.assessResponseQuality(llamaindexResults) : ['Not available'];

    const report: ComparisonReport = {
      timestamp: new Date(),
      totalQueries: this.testQueries.length,
      langchainResults,
      llamaindexResults,
      performance: {
        langchain: langchainPerf,
        llamaindex: llamaindexPerf
      },
      qualityAssessment: {
        langchain: langchainQuality,
        llamaindex: llamaindexQuality
      }
    };

    this.printComparisonSummary(report);
    return report;
  }

  private calculatePerformanceMetrics(results: BenchmarkResult[]): { avgTime: number; successRate: number } {
    const successfulResults = results.filter(r => r.success);
    const avgTime = successfulResults.length > 0 ? 
      successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length : 0;
    const successRate = results.length > 0 ? (successfulResults.length / results.length) * 100 : 0;
    
    return { avgTime, successRate };
  }

  private assessResponseQuality(results: BenchmarkResult[]): string[] {
    const assessments: string[] = [];
    
    results.forEach(result => {
      if (result.success) {
        const response = result.response.toLowerCase();
        let quality = 'Basic';
        
        // Check for Catholic-specific indicators
        if (response.includes('catechism') || response.includes('ccc')) quality = 'Good - Cited sources';
        if (response.includes('scripture') || response.includes('bible')) quality = 'Good - Biblical reference';
        if (response.includes('church teach') || response.includes('magisterium')) quality = 'Excellent - Church authority';
        if (response.length < 100) quality = 'Poor - Too brief';
        if (response.includes('error') || response.includes('sorry')) quality = 'Poor - Error/Limitation';
        
        assessments.push(`${result.query.substring(0, 30)}...: ${quality}`);
      } else {
        assessments.push(`${result.query.substring(0, 30)}...: Failed`);
      }
    });

    return assessments;
  }

  private printComparisonSummary(report: ComparisonReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RAG IMPLEMENTATION COMPARISON SUMMARY');
    console.log('='.repeat(60));
    
    console.log('\n🏃‍♂️ PERFORMANCE METRICS:');
    console.log(`LangChain: ${report.performance.langchain.avgTime.toFixed(2)}ms avg, ${report.performance.langchain.successRate.toFixed(1)}% success`);
    console.log(`LlamaIndex: ${report.performance.llamaindex.avgTime.toFixed(2)}ms avg, ${report.performance.llamaindex.successRate.toFixed(1)}% success`);
    
    if (report.performance.langchain.avgTime > 0 && report.performance.llamaindex.avgTime > 0) {
      const winner = report.performance.langchain.avgTime < report.performance.llamaindex.avgTime ? 'LangChain' : 'LlamaIndex';
      const speedup = Math.abs(report.performance.langchain.avgTime - report.performance.llamaindex.avgTime);
      console.log(`🏆 ${winner} is faster by ${speedup.toFixed(2)}ms on average`);
    }

    console.log('\n📝 QUALITY ASSESSMENT HIGHLIGHTS:');
    console.log('LangChain:');
    report.qualityAssessment.langchain.slice(0, 3).forEach(assessment => {
      console.log(`   • ${assessment}`);
    });
    
    if (report.qualityAssessment.llamaindex.length > 1 || report.qualityAssessment.llamaindex[0] !== 'Not available') {
      console.log('LlamaIndex:');
      report.qualityAssessment.llamaindex.slice(0, 3).forEach(assessment => {
        console.log(`   • ${assessment}`);
      });
    }

    console.log('\n💡 RECOMMENDATIONS:');
    if (report.performance.langchain.successRate > report.performance.llamaindex.successRate) {
      console.log('   • LangChain shows better reliability for Catholic content');
    }
    if (report.performance.llamaindex.avgTime > 0 && report.performance.llamaindex.avgTime < report.performance.langchain.avgTime) {
      console.log('   • LlamaIndex provides faster responses');
    }
    console.log('   • Consider hybrid approach using both implementations');
    console.log('   • LangChain fallback provides better reliability without OpenAI dependency');
    
    console.log('\n' + '='.repeat(60));
  }

  async quickTest(implementation: 'LangChain' | 'LlamaIndex' = 'LangChain'): Promise<void> {
    console.log(`🧪 Quick test of ${implementation}...`);
    
    const documents = await this.loadTestDocuments();
    
    if (implementation === 'LangChain') {
      const rag = await initializeWithCatholicDocuments(documents);
      const response = await rag.generateResponse('What is the Trinity?', {
        userId: 'quick-test',
        mode: 'standard',
        language: 'en'
      });
      console.log('Response:', response.substring(0, 200) + '...');
    } else {
      // LlamaIndex temporarily disabled - use LangChain fallback
      console.log('Using LangChain fallback for LlamaIndex test');
      const rag = await initializeWithCatholicDocuments(documents);
      const response = await rag.generateResponse('What is the Trinity?', {
        userId: 'quick-test',
        mode: 'standard',
        language: 'en'
      });
      console.log('Response:', response.substring(0, 200) + '...');
    }
  }
}

export const ragComparison = new RAGComparison();