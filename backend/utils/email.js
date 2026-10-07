import nodemailer from 'nodemailer';

const createTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const BRAND = {
  name: 'EcoCity Smart Waste',
  color: '#28a745',
  logo: '🌿',
};

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 30px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #28a745, #20c997); padding: 32px 40px; color: white; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .header p { margin: 6px 0 0; opacity: 0.85; font-size: 14px; }
    .body { padding: 36px 40px; color: #333; }
    .body h2 { color: #1a1a1a; margin-top: 0; }
    .body p { line-height: 1.7; color: #555; }
    .info-box { background: #f8f9fa; border-left: 4px solid #28a745; border-radius: 6px; padding: 16px 20px; margin: 20px 0; }
    .info-box p { margin: 4px 0; }
    .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #28a745, #20c997); color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 20px 0; }
    .footer { background: #f8f9fa; color: #999; text-align: center; padding: 20px; font-size: 12px; border-top: 1px solid #eee; }
    .badge { display: inline-block; background: #e6f4ea; color: #28a745; font-size: 12px; padding: 3px 10px; border-radius: 20px; font-weight: 600; }
    .badge-warning { background: #fff3cd; color: #856404; }
    .badge-danger { background: #fde8e8; color: #dc3545; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>${BRAND.logo} ${BRAND.name}</h1>
      <p>Smart City Waste Management Platform</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} EcoCity Smart Waste Management. This is an automated message.</p>
      <p>Municipality Administration | Smart City Initiative</p>
    </div>
  </div>
</body>
</html>`;

// Welcome email on login
export const sendLoginWelcomeEmail = async (user) => {
  const transporter = createTransporter();
  const dashboardUrl = `${process.env.FRONTEND_URL}/${user.role}/dashboard`;
  const roleLabel = user.role === 'citizen' ? 'Citizen' : user.role === 'partner' ? 'Collection Partner' : 'Administrator';
  const content = `
      <h2>Welcome back, ${user.name}! 👋</h2>
      <p>You have successfully signed in to <strong>EcoCity Smart Waste Management</strong>.</p>
      <div class="info-box">
        <p><strong>Account:</strong> ${user.email}</p>
        <p><strong>Role:</strong> ${roleLabel}</p>
        <p><strong>Login Time:</strong> ${new Date().toLocaleString('en-IN')}</p>
      </div>
      ${user.role === 'citizen' ? `<p>🌿 You have <strong>${user.ecoCoins || 0} Eco Coins</strong>. Keep reporting garbage to earn more!</p>` : ''}
      <a href="${dashboardUrl}" class="btn">Go to Your Dashboard →</a>
      <p style="font-size:13px;color:#999;">If this wasn't you, please contact us immediately at ${process.env.ADMIN_EMAIL}</p>
    `;
  await transporter.sendMail({
    from: `"EcoCity Smart Waste" <${process.env.GMAIL_USER}>`,
    to: user.email,
    subject: `Welcome back to EcoCity, ${user.name}! 🌿`,
    html: baseTemplate(content),
  });
};

// Email to admin when a partner registers

export const sendPartnerApplicationEmail = async (partner) => {
  const transporter = createTransporter();
  const adminDashboardUrl = `${process.env.FRONTEND_URL}/admin/dashboard`;
  const content = `
      <h2>New Partner Application</h2>
      <p>A new waste collection partner has submitted an application and is awaiting your approval.</p>
      <div class="info-box">
        <p><strong>Name:</strong> ${partner.name}</p>
        <p><strong>Email:</strong> ${partner.email}</p>
        <p><strong>Applied at:</strong> ${new Date().toLocaleString('en-IN')}</p>
        <p><strong>Status:</strong> <span class="badge badge-warning">Pending Approval</span></p>
      </div>
      <p>As the Municipality Head, please review the application and approve or reject it through your admin dashboard.</p>
      <a href="${adminDashboardUrl}" class="btn">Review Application →</a>
      <p style="font-size:13px; color:#999;">You are receiving this because you are the registered admin of EcoCity Smart Waste Management.</p>
    `;
  await transporter.sendMail({
    from: `"EcoCity System" <${process.env.GMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `[Action Required] New Partner Application – ${partner.name}`,
    html: baseTemplate(content),
  });
};

// Email to partner when approved
export const sendPartnerApprovedEmail = async (partner) => {
  const transporter = createTransporter();
  const loginUrl = `${process.env.FRONTEND_URL}/login`;
  const content = `
      <h2>Your Application Has Been Approved! 🎉</h2>
      <p>Dear <strong>${partner.name}</strong>,</p>
      <p>Congratulations! The Municipality Administration has reviewed and <strong>approved</strong> your partner application on the EcoCity Smart Waste Management platform.</p>
      <div class="info-box">
        <p><strong>Account Status:</strong> <span class="badge">Active</span></p>
        <p><strong>Role:</strong> Waste Collection Partner</p>
      </div>
      <p>You can now log in to your Partner Dashboard to view and manage garbage collection tasks assigned to you.</p>
      <a href="${loginUrl}" class="btn">Login to Your Dashboard →</a>
      <p>Thank you for joining us in building a cleaner city!</p>
    `;
  await transporter.sendMail({
    from: `"EcoCity Admin" <${process.env.GMAIL_USER}>`,
    to: partner.email,
    subject: 'Your EcoCity Partner Application Has Been Approved ✅',
    html: baseTemplate(content),
  });
};

// Email to partner when rejected
export const sendPartnerRejectedEmail = async (partner) => {
  const transporter = createTransporter();
  const content = `
      <h2>Application Status Update</h2>
      <p>Dear <strong>${partner.name}</strong>,</p>
      <p>We regret to inform you that your partner application on the EcoCity Smart Waste Management platform has been reviewed and <strong>was not approved</strong> at this time.</p>
      <div class="info-box">
        <p><strong>Account Status:</strong> <span class="badge badge-danger">Rejected</span></p>
      </div>
      <p>If you believe this was a mistake or would like more information, please contact the municipality administration directly.</p>
      <p style="font-size:13px; color:#999;">Contact: ${process.env.ADMIN_EMAIL}</p>
    `;
  await transporter.sendMail({
    from: `"EcoCity Admin" <${process.env.GMAIL_USER}>`,
    to: partner.email,
    subject: 'EcoCity Partner Application Status Update',
    html: baseTemplate(content),
  });
};

// Email to citizen when their report status changes
export const sendReportStatusEmail = async (citizen, report, newStatus) => {
  const transporter = createTransporter();
  const statusMessages = {
    Assigned: { msg: 'A waste collection team has been <strong>assigned</strong> to your report and will arrive shortly.', badge: 'badge-warning' },
    Cleaning: { msg: 'Our team is currently <strong>cleaning</strong> the reported area. Thank you for your patience.', badge: 'badge-warning' },
    Completed: { msg: 'The garbage at your reported location has been <strong>successfully cleaned</strong>! You have been awarded <strong>${report.coinsAwarded} Eco Coins</strong>.', badge: '' },
  };
  const s = statusMessages[newStatus] || { msg: 'Your report status has been updated.', badge: '' };
  const content = `
      <h2>Report Status Update</h2>
      <p>Dear <strong>${citizen.name}</strong>,</p>
      <p>${s.msg}</p>
      <div class="info-box">
        <p><strong>Report Location:</strong> ${report.location?.address || 'As reported'}</p>
        <p><strong>Waste Type:</strong> ${report.wasteType}</p>
        <p><strong>New Status:</strong> <span class="badge ${s.badge}">${newStatus}</span></p>
      </div>
      <p>Thank you for contributing to a cleaner city! Keep reporting to earn more Eco Coins.</p>
    `;
  await transporter.sendMail({
    from: `"EcoCity System" <${process.env.GMAIL_USER}>`,
    to: citizen.email,
    subject: `Your Waste Report is Now: ${newStatus} – EcoCity`,
    html: baseTemplate(content),
  });
};

// Email to citizen when penalized for a false report
export const sendPenaltyEmail = async (citizen, coinsDeducted) => {
  const transporter = createTransporter();
  const content = `
      <h2>Notice: Eco Coins Deducted</h2>
      <p>Dear <strong>${citizen.name}</strong>,</p>
      <p>This is a notification that your recent garbage report was reviewed and marked as a <strong>False Report</strong> by our collection partners and municipality admin.</p>
      <div class="info-box">
        <p><strong>Penalty Applied:</strong> <span class="badge badge-danger">-${coinsDeducted} Eco Coins</span></p>
        <p><strong>Current Balance:</strong> ${citizen.ecoCoins - coinsDeducted} Eco Coins</p>
      </div>
      <p>Please ensure that future reports accurately reflect real garbage at the specified locations. Repeated false reporting may lead to account suspension.</p>
      <p>Thank you for your cooperation in keeping our city clean.</p>
    `;
  await transporter.sendMail({
    from: `"EcoCity System" <${process.env.GMAIL_USER}>`,
    to: citizen.email,
    subject: 'Important: Eco Coins Deducted for False Report',
    html: baseTemplate(content),
  });
};

// Contact form email to admin
export const sendContactFormEmail = async ({ name, email, subject, message }) => {
  const transporter = createTransporter();
  const content = `
      <h2>New Contact Form Message</h2>
      <div class="info-box">
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
      </div>
      <p><strong>Message:</strong></p>
      <div class="info-box"><p>${message}</p></div>
      <p style="font-size:13px; color:#999;">Reply directly to ${email}</p>
    `;
  await transporter.sendMail({
    from: `"EcoCity Contact Form" <${process.env.GMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    replyTo: email,
    subject: `[Contact] ${subject} – from ${name}`,
    html: baseTemplate(content),
  });
};
