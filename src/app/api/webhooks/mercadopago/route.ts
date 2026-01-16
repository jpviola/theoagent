import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Payment } from 'mercadopago';

// Initialize MercadoPago client
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: { timeout: 5000 }
});

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 MercadoPago Webhook received');
    
    const body = await request.json();
    const { type, action, data } = body;

    console.log('Webhook data:', { type, action, data_id: data?.id });

    // Only process payment notifications
    if (type !== 'payment') {
      console.log('ℹ️ Not a payment notification, ignoring');
      return NextResponse.json({ status: 'ignored' }, { status: 200 });
    }

    // Get payment details from MercadoPago API
    const paymentId = data.id;
    const payment = new Payment(client);
    
    try {
      const paymentData = await payment.get({ id: paymentId });

      if (!paymentData.id) {
        console.error('❌ Payment data is missing id:', paymentData);
        return NextResponse.json({
          error: 'Invalid payment data: missing id',
          payment: paymentData
        }, { status: 400 });
      }

      const mpStatus = paymentData.status ?? 'unknown';
      const currencyId = paymentData.currency_id ?? 'USD';
      console.log('💳 Payment data retrieved:', {
        id: paymentData.id,
        status: paymentData.status,
        status_detail: paymentData.status_detail,
        transaction_amount: paymentData.transaction_amount,
        currency_id: paymentData.currency_id,
        external_reference: paymentData.external_reference
      });

      // Update donation in database based on payment status
      const donationUpdate = {
        payment_id: paymentData.id.toString(),
        status: mapMercadoPagoStatus(mpStatus),
        payment_status: mpStatus,
        status_detail: paymentData.status_detail,
        processed_at: new Date().toISOString(),
        webhook_data: {
          payment_id: paymentData.id,
          status: paymentData.status,
          status_detail: paymentData.status_detail,
          payment_method: paymentData.payment_method?.id,
          payment_type_id: paymentData.payment_type_id,
          transaction_amount: paymentData.transaction_amount,
          currency_id: currencyId,
          external_reference: paymentData.external_reference,
          processed_at: new Date().toISOString()
        }
      };

      // Find donation by external reference or create new one
      let donationResult;
      
      if (paymentData.external_reference) {
        const { data: existingDonation } = await supabase
          .from('donations')
          .select('*')
          .eq('external_reference', paymentData.external_reference)
          .single();

        if (existingDonation) {
          const { data: updatedDonation, error: updateError } = await supabase
            .from('donations')
            .update(donationUpdate)
            .eq('external_reference', paymentData.external_reference)
            .select()
            .single();

          if (updateError) {
            console.error('❌ Error updating donation:', updateError);
          } else {
            console.log('✅ Donation updated:', updatedDonation.id);
            donationResult = updatedDonation;
          }
        }
      }

      // If no existing donation found, create new one
      if (!donationResult) {
        const newDonation = {
          ...donationUpdate,
          amount: paymentData.transaction_amount,
          currency: currencyId,
          payment_provider: 'mercadopago',
          donor_email: paymentData.payer?.email || 'webhook@santapalabra.app',
          donor_name: `${paymentData.payer?.first_name || ''} ${paymentData.payer?.last_name || ''}`.trim() || 'Donante MercadoPago',
          external_reference: paymentData.external_reference || `mp_${paymentData.id}`,
          country: extractCountryFromCurrency(currencyId),
          metadata: {
            webhook_created: true,
            payer_info: paymentData.payer,
            payment_method: paymentData.payment_method
          }
        };

        const { data: createdDonation, error: createError } = await supabase
          .from('donations')
          .insert([newDonation])
          .select()
          .single();

        if (createError) {
          console.error('❌ Error creating donation:', createError);
        } else {
          console.log('✅ New donation created:', createdDonation.id);
          donationResult = createdDonation;
        }
      }

      return NextResponse.json({
        status: 'processed',
        payment_id: paymentData.id,
        payment_status: paymentData.status,
        donation_id: donationResult?.id
      }, { status: 200 });

    } catch (paymentError) {
      console.error('❌ Error fetching payment from MercadoPago:', paymentError);
      return NextResponse.json({
        error: 'Payment fetch error',
        payment_id: paymentId
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json({
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    webhook: 'MercadoPago Webhook Endpoint',
    status: 'active',
    timestamp: new Date().toISOString(),
    supported_events: ['payment']
  });
}

// Helper function to map MercadoPago status to our internal status
function mapMercadoPagoStatus(mpStatus: string): string {
  switch (mpStatus) {
    case 'approved':
      return 'completed';
    case 'pending':
      return 'pending';
    case 'authorized':
      return 'authorized';
    case 'in_process':
      return 'processing';
    case 'in_mediation':
      return 'disputed';
    case 'rejected':
      return 'failed';
    case 'cancelled':
      return 'cancelled';
    case 'refunded':
      return 'refunded';
    case 'charged_back':
      return 'charged_back';
    default:
      return 'unknown';
  }
}

// Helper function to extract country from currency
function extractCountryFromCurrency(currency: string): string {
  const currencyToCountry: { [key: string]: string } = {
    'ARS': 'Argentina',
    'BRL': 'Brasil',
    'MXN': 'México',
    'COP': 'Colombia',
    'PEN': 'Perú',
    'UYU': 'Uruguay',
    'CLP': 'Chile',
    'USD': 'Internacional'
  };
  
  return currencyToCountry[currency] || 'Unknown';
}
