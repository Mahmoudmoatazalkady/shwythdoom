import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

function sendOrderEmails(order, callback) {
  // Email to customer
  // Format order details for readability
  const formatOrderDetails = (order) => {
    let itemsSection = '';
    if (order.items && order.items.length) {
      itemsSection = '\nItems Ordered:';
      order.items.forEach((item, idx) => {
        itemsSection += `\n  ${idx + 1}. ${item.name}${item.options ? ' (' + JSON.stringify(item.options) + ')' : ''} - Qty: ${item.quantity}, Price: ${item.price}`;
      });
    }
    return [
      'Order Summary',
      '-------------------------',
      `Order Number: ${order.orderNumber || ''}`,
      `Date: ${order.date ? new Date(order.date).toLocaleString() : ''}`,
      '',
      'Customer Info:',
      `Name: ${order.firstName || ''} ${order.lastName || ''}`,
      `Email: ${order.email || ''}`,
      `Phone: ${order.phone || ''}`,
      `Address: ${order.address || ''}`,
      `City: ${order.city || ''}`,
      `Governorate: ${order.governorate || ''}`,
      `Zip Code: ${order.zipCode || ''}`,
      '',
      itemsSection,
      '',
      `Total: ${order.total || 0}`,
      `Payment Method: ${order.paymentMethod || ''}`,
      order.promoCode ? `Promo Code: ${order.promoCode}` : '',
      order.discountPercent ? `Discount: ${order.discountPercent}%` : '',
      '-------------------------'
    ].filter(Boolean).join('\n');
  };

  // HTML email layout for customer
  const customerMailOptions = {
    from: process.env.GMAIL_USER,
    to: order.email,
    subject: 'Order Confirmation - Alqady Clothes',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Order Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; background: #181c23; color: #fff; margin: 0; padding: 0; }
          .container { max-width: 480px; margin: 30px auto; background: #23272f; border-radius: 10px; box-shadow: 0 2px 8px #0006; padding: 32px 24px; }
          h2 { text-align: center; margin-bottom: 24px; color: #00ffae; letter-spacing: 1px; }
          .info { margin-bottom: 18px; color: #fff; }
          .label { font-weight: bold; color: #00ffae; }
          .order-details { background: #181c23; border-radius: 8px; padding: 16px; margin-bottom: 18px; color: #fff; border: 2px solid #00ffae; }
          .btn { display: block; width: 100%; background: #00ffae; color: #181c23; text-align: center; padding: 14px 0; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin-top: 24px; letter-spacing: 1px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Order Confirmation</h2>
          <div class="info">
            <span class="label">Date & Time:</span> ${order.date ? new Date(order.date).toLocaleString() : ''}
          </div>
          <div class="info">
            <span class="label">Customer Name:</span> ${order.firstName || ''} ${order.lastName || ''}
          </div>
          <div class="info">
            <span class="label">Shipping Location:</span> ${order.shippingAddress || order.address || ''}, ${order.shippingCity || order.city || ''}, ${order.shippingCountry || order.country || ''}
          </div>
          <div class="order-details">
            <span class="label">Order Information:</span><br>
            Order Number: ${order.orderNumber || ''}<br>
            ${order.items && order.items.length ? order.items.map((item, idx) => `${idx + 1}. ${item.name} - Qty: ${item.quantity}, Price: $${item.price}`).join('<br>') : ''}
            <br>Total: $${order.total || '0.00'}
          </div>
          // add the store link using the host service
          
          <a href="#" class="btn">return to store</a>
        </div>
      </body>
      </html>
    `,
  };

  // Email to company
  const companyMailOptions = {
    from: process.env.GMAIL_USER,
    to: process.env.COMPANY_EMAIL,
    subject: 'New Order Received - Alqady Clothes',
    text:
      'A new order has been placed.\n\n' +
      formatOrderDetails(order) + '\n\n' +
      'Please process this order promptly.',
  };

  // Send to customer
  transporter.sendMail(customerMailOptions, (err, info) => {
    if (err) return callback(err);
    // Send to company after customer
    transporter.sendMail(companyMailOptions, callback);
  });
}

export default sendOrderEmails;
