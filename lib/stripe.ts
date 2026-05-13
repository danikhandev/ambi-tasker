import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is not defined. Stripe features will be mocked.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'mock_key', {
  apiVersion: '2025-01-27' as any,
  typescript: true,
});

/**
 * Creates a Stripe Checkout Session for a booking.
 */
export async function createCheckoutSession({
  bookingId,
  amount,
  currency = 'pkr',
  customerEmail,
  description,
}: {
  bookingId: string;
  amount: number;
  currency?: string;
  customerEmail: string;
  description: string;
}) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: 'AmbiTasker Service Fee',
              description,
            },
            unit_amount: Math.round(amount * 100), // Stripe expects cents/paise
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings/${bookingId}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings/${bookingId}?payment=cancelled`,
      metadata: {
        bookingId,
      },
      customer_email: customerEmail,
    });

    return session;
  } catch (error) {
    console.error('Stripe Exception:', error);
    throw error;
  }
}
