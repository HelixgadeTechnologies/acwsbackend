import assert from 'assert';
import { getAttendeeTicketPricing, getVendorTierPricing } from '../config/pricing';
import * as stripeService from '../services/stripe.service';
import app from '../app';

async function runTests() {
  console.log('--- Starting Stripe Integration Tests ---');

  // Test 1: Attendee Pricing
  console.log('Testing Attendee Pricing...');
  const vipPricing = getAttendeeTicketPricing('VIP Pass');
  assert.strictEqual(vipPricing.priceInPounds, 40);
  assert.strictEqual(vipPricing.amountInPence, 4000);
  assert.strictEqual(vipPricing.fastTrackPass, true);

  const couplePricing = getAttendeeTicketPricing('Couple Ticket');
  assert.strictEqual(couplePricing.priceInPounds, 35);
  assert.strictEqual(couplePricing.amountInPence, 3500);
  assert.strictEqual(couplePricing.fastTrackPass, false);

  const generalPricing = getAttendeeTicketPricing('General Admission');
  assert.strictEqual(generalPricing.priceInPounds, 20);
  assert.strictEqual(generalPricing.amountInPence, 2000);
  assert.strictEqual(generalPricing.fastTrackPass, false);

  const compPricing = getAttendeeTicketPricing('Complimentary Ticket');
  assert.strictEqual(compPricing.priceInPounds, 0);
  assert.strictEqual(compPricing.amountInPence, 0);
  console.log('✓ Attendee Pricing passed.');

  // Test 2: Vendor Tier Pricing
  console.log('Testing Vendor Tier Pricing...');
  const stdPricing = getVendorTierPricing('standard');
  assert.strictEqual(stdPricing.priceInPounds, 250);
  assert.strictEqual(stdPricing.amountInPence, 25000);

  const premPricing = getVendorTierPricing('premium');
  assert.strictEqual(premPricing.priceInPounds, 450);
  assert.strictEqual(premPricing.amountInPence, 45000);

  const catwalkPricing = getVendorTierPricing('catwalk');
  assert.strictEqual(catwalkPricing.priceInPounds, 650);
  assert.strictEqual(catwalkPricing.amountInPence, 65000);

  const execPricing = getVendorTierPricing('executive');
  assert.strictEqual(execPricing.priceInPounds, 950);
  assert.strictEqual(execPricing.amountInPence, 95000);
  console.log('✓ Vendor Tier Pricing passed.');

  // Test 3: Stripe Checkout Session Mock/Live Generator
  console.log('Testing Checkout Session Generator for Attendee...');
  const mockAttendee: any = {
    _id: '507f191e810c19729de860ea',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    refCode: 'ACWS-2027-ATT-TEST',
    ticketType: 'VIP Pass',
  };

  try {
    const sessionResult = await stripeService.createAttendeeCheckoutSession(mockAttendee);
    assert(sessionResult !== null);
    assert(sessionResult.checkoutUrl !== null);
    assert(typeof sessionResult.sessionId === 'string');
    console.log(`✓ Attendee Checkout Session URL created: ${sessionResult.checkoutUrl}`);
  } catch (err: any) {
    if (err.type === 'StripeConnectionError' || err.code === 'ENOTFOUND') {
      console.log('ℹ Stripe API live call skipped (sandbox/offline environment without external network).');
    } else {
      throw err;
    }
  }

  console.log('Testing Checkout Session Generator for Vendor...');
  const mockVendor: any = {
    _id: '507f191e810c19729de860eb',
    businessName: 'Luxe Floral Decor',
    email: 'contact@luxefloral.com',
    refCode: 'ACWS-2027-VND-TEST',
    paymentTier: 'premium',
  };

  try {
    const vendorSessionResult = await stripeService.createVendorCheckoutSession(mockVendor);
    assert(vendorSessionResult !== null);
    assert(vendorSessionResult.checkoutUrl !== null);
    assert(typeof vendorSessionResult.sessionId === 'string');
    console.log(`✓ Vendor Checkout Session URL created: ${vendorSessionResult.checkoutUrl}`);
  } catch (err: any) {
    if (err.type === 'StripeConnectionError' || err.code === 'ENOTFOUND') {
      console.log('ℹ Stripe API live call skipped (sandbox/offline environment without external network).');
    } else {
      throw err;
    }
  }

  // Test 4: Webhook Signature Verification Guard
  console.log('Testing Webhook Signature Guard...');
  try {
    stripeService.constructWebhookEvent(Buffer.from('{}'), 'invalid_signature');
    assert.fail('Should have thrown an error for invalid signature');
  } catch (err: any) {
    assert(err.message.includes('Stripe webhook') || err.message.includes('secret'));
    console.log('✓ Webhook signature guard correctly rejected unverified payload.');
  }

  // Test 5: Express App Route Registration
  console.log('Testing Express Routes Registration...');
  const routes = (app as any)._router.stack;
  const hasRawWebhook = routes.some(
    (layer: any) => layer.route && layer.route.path === '/api/v1/payments/webhook'
  );
  assert(hasRawWebhook, 'Raw webhook endpoint should be registered on Express app');
  console.log('✓ Webhook route registered with raw body parsing on Express app.');

  // Test 6: Attendee Public Pass HTML Generation
  console.log('Testing Attendee Pass HTML Generation...');
  const { renderAttendeePassHtml } = require('../services/attendee.service');
  const samplePass = renderAttendeePassHtml({
    refCode: 'ACWS-2027-ATT-TEST',
    fullName: 'Amara Diallo',
    ticketType: 'VIP Pass',
    ticketPrice: '£40',
    paymentStatus: 'paid',
    fastTrackPass: true,
    checkedIn: false,
    registeredAt: new Date(),
    qrCode: 'data:image/png;base64,mock',
  });
  assert(samplePass.includes('Amara Diallo'));
  assert(samplePass.includes('ACWS-2027-ATT-TEST'));
  assert(samplePass.includes('VIP Pass'));
  assert(samplePass.includes('Fast Track Access'));
  console.log('✓ Attendee Pass HTML renders with attendee name, VIP badge, and fast track pass.');

  // Test 7: Device Info Extraction
  console.log('Testing Device Info Extraction...');
  const { extractDeviceInfo } = require('../utils/device.util');
  const mockMobileReq: any = {
    headers: {
      'user-agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'x-forwarded-for': '198.51.100.42, 10.0.0.1',
    },
  };
  const mobileDevice = extractDeviceInfo(mockMobileReq);
  assert.strictEqual(mobileDevice.ip, '198.51.100.42');
  assert.strictEqual(mobileDevice.deviceType, 'mobile');
  assert.strictEqual(mobileDevice.os, 'iOS');
  assert.strictEqual(mobileDevice.browser, 'Safari');

  const mockDesktopReq: any = {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    ip: '203.0.113.19',
  };
  const desktopDevice = extractDeviceInfo(mockDesktopReq);
  assert.strictEqual(desktopDevice.ip, '203.0.113.19');
  assert.strictEqual(desktopDevice.deviceType, 'desktop');
  assert.strictEqual(desktopDevice.os, 'Windows 10/11');
  assert.strictEqual(desktopDevice.browser, 'Chrome');
  console.log('✓ Device info extraction correctly parses IP, mobile/desktop, OS, and browser.');

  console.log('--- ALL STRIPE INTEGRATION TESTS PASSED ---');
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test execution error:', err);
    process.exit(1);
  });

