import mongoose from 'mongoose';
import Vendor, { generateRefCode } from '../models/vendor.model';
import ApiError from '../utils/ApiError';
import env from '../config/env';
import { generateQRCodeDataUrl } from './qrcode.service';
import {
  CreateVendorInput,
  IVendor,
  PublicVendorProfile,
  VendorQueryFilters,
  VendorStatus,
} from '../interfaces/vendor.interface';

/**
 * Builds the public profile destination URL for a given reference code.
 */
export const buildPublicProfileUrl = (refCode: string): string => {
  const base = env.publicProfileBaseUrl.replace(/\/$/, '');
  if (base.includes('/public')) {
    return `${base}/${refCode}/card`;
  }
  return `${base}/${refCode}`;
};

/**
 * Register a new vendor submission and automatically generate QR code.
 */
export const registerVendor = async (data: CreateVendorInput): Promise<IVendor> => {
  // Check if vendor already exists with the same email
  const existingVendor = await Vendor.findOne({ email: data.email.toLowerCase().trim() });
  if (existingVendor) {
    throw new ApiError(
      409,
      `A vendor registration with email "${data.email}" already exists (Ref: ${existingVendor.refCode})`
    );
  }

  const refCode = data.refCode ? data.refCode.toUpperCase().trim() : generateRefCode();
  const publicProfileUrl = buildPublicProfileUrl(refCode);
  const qrCode = await generateQRCodeDataUrl(publicProfileUrl);

  const vendor = await Vendor.create({
    ...data,
    refCode,
    publicProfileUrl,
    qrCode,
  });

  return vendor;
};

/**
 * Fetch public vendor profile by refCode.
 * Strips all internal survey/billing data for public visitor view.
 */
export const getPublicVendorProfile = async (
  refCode: string
): Promise<PublicVendorProfile> => {
  const cleanCode = refCode.toUpperCase().trim();
  const vendor = await Vendor.findOne({ refCode: cleanCode });

  if (!vendor) {
    throw new ApiError(404, `Exhibitor with reference code "${cleanCode}" was not found.`);
  }

  // Ensure QR code exists (if older record created before QR implementation)
  let qrCode = vendor.qrCode;
  let publicProfileUrl = vendor.publicProfileUrl;
  if (!qrCode || !publicProfileUrl) {
    publicProfileUrl = buildPublicProfileUrl(vendor.refCode);
    qrCode = await generateQRCodeDataUrl(publicProfileUrl);
    vendor.publicProfileUrl = publicProfileUrl;
    vendor.qrCode = qrCode;
    await vendor.save();
  }

  return {
    refCode: vendor.refCode,
    businessName: vendor.businessName,
    website: vendor.website,
    instagram: vendor.instagram,
    phone: vendor.phone,
    email: vendor.email,
    category: vendor.category,
    baseLocation: vendor.baseLocation,
    qrCode,
    publicProfileUrl,
  };
};

/**
 * Generates an unauthenticated, mobile-first responsive HTML Digital Business Card.
 */
export const renderVendorCardHtml = (vendor: PublicVendorProfile): string => {
  const cleanIg = vendor.instagram ? vendor.instagram.replace(/^@/, '') : '';
  const igUrl = cleanIg ? `https://instagram.com/${cleanIg}` : '#';
  const cleanWeb = vendor.website && vendor.website !== 'N/A'
    ? (vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`)
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${vendor.businessName} | ACWS 2027 Exhibitor</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #0c0d0f;
      background-image: radial-gradient(circle at 50% 0%, #1e1b18 0%, #0c0d0f 75%);
      color: #f4f4f6;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
    }
    .card {
      width: 100%;
      max-width: 440px;
      background: #141519;
      border: 1px solid rgba(212, 175, 55, 0.25);
      border-radius: 20px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(212, 175, 55, 0.08);
      overflow: hidden;
      animation: fadeIn 0.5s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .header {
      background: linear-gradient(135deg, #1b1c22 0%, #26241e 100%);
      border-bottom: 1px solid rgba(212, 175, 55, 0.2);
      padding: 22px 20px 18px;
      text-align: center;
      position: relative;
    }
    .event-badge {
      display: inline-block;
      font-size: 11px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #d4af37;
      background: rgba(212, 175, 55, 0.12);
      border: 1px solid rgba(212, 175, 55, 0.3);
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 10px;
      font-weight: 600;
    }
    .biz-title {
      font-family: 'Cinzel', serif;
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.25;
      margin-bottom: 6px;
    }
    .category-tag {
      font-size: 13px;
      color: #bfa15f;
      font-weight: 500;
    }
    .body {
      padding: 24px 20px;
    }
    .location-box {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 13px;
      color: #9ba0a6;
      margin-bottom: 22px;
    }
    .links-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }
    .btn-link {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #1b1d24;
      border: 1px solid #2a2d38;
      color: #f0f0f2;
      text-decoration: none;
      padding: 14px 18px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    .btn-link:hover, .btn-link:active {
      background: #232630;
      border-color: #d4af37;
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(212, 175, 55, 0.15);
    }
    .btn-link .label-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .btn-link .icon {
      font-size: 18px;
    }
    .btn-link .subtext {
      display: block;
      font-size: 11px;
      color: #8c909a;
      font-weight: 400;
      margin-top: 2px;
    }
    .btn-link .chevron {
      color: #d4af37;
      font-size: 16px;
    }
    .qr-section {
      background: #101115;
      border: 1px solid #22242c;
      border-radius: 14px;
      padding: 18px;
      text-align: center;
      margin-top: 6px;
    }
    .qr-img {
      width: 170px;
      height: 170px;
      background: #ffffff;
      padding: 8px;
      border-radius: 10px;
      margin: 0 auto 12px;
      display: block;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
    }
    .qr-ref {
      font-family: monospace;
      font-size: 12px;
      color: #d4af37;
      letter-spacing: 1px;
      font-weight: 600;
    }
    .footer {
      text-align: center;
      padding: 16px 20px;
      border-top: 1px solid #1f2129;
      font-size: 11px;
      color: #656974;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="event-badge">ACWS 2027 Exhibitor</span>
      <h1 class="biz-title">${vendor.businessName}</h1>
      <p class="category-tag">${vendor.category}</p>
    </div>

    <div class="body">
      <div class="location-box">
        <span>📍</span>
        <span>${vendor.baseLocation}</span>
      </div>

      <div class="links-grid">
        <a href="tel:${vendor.phone}" class="btn-link">
          <div class="label-group">
            <span class="icon">📞</span>
            <div>
              <div>Phone Number</div>
              <span class="subtext">${vendor.phone}</span>
            </div>
          </div>
          <span class="chevron">→</span>
        </a>

        <a href="mailto:${vendor.email}" class="btn-link">
          <div class="label-group">
            <span class="icon">✉️</span>
            <div>
              <div>Email Address</div>
              <span class="subtext">${vendor.email}</span>
            </div>
          </div>
          <span class="chevron">→</span>
        </a>

        ${
          cleanIg
            ? `<a href="${igUrl}" target="_blank" rel="noopener noreferrer" class="btn-link">
                 <div class="label-group">
                   <span class="icon">📸</span>
                   <div>
                     <div>Instagram</div>
                     <span class="subtext">@${cleanIg}</span>
                   </div>
                 </div>
                 <span class="chevron">↗</span>
               </a>`
            : ''
        }

        ${
          cleanWeb
            ? `<a href="${cleanWeb}" target="_blank" rel="noopener noreferrer" class="btn-link">
                 <div class="label-group">
                   <span class="icon">🌐</span>
                   <div>
                     <div>Official Website</div>
                     <span class="subtext">${vendor.website}</span>
                   </div>
                 </div>
                 <span class="chevron">↗</span>
               </a>`
            : ''
        }
      </div>

      ${
        vendor.qrCode
          ? `<div class="qr-section">
               <img src="${vendor.qrCode}" alt="Vendor QR Code" class="qr-img" />
               <div class="qr-ref">REF: ${vendor.refCode}</div>
             </div>`
          : ''
      }
    </div>

    <div class="footer">
      African & Caribbean Wedding Show 2027 • Official Digital Pass
    </div>
  </div>
</body>
</html>`;
};

/**
 * Fetch paginated list of vendors with filtering and search for Admin
 */
export const getAdminVendors = async (
  query: VendorQueryFilters
): Promise<{ vendors: IVendor[]; total: number; totalPages: number; currentPage: number; page: number }> => {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || '-createdAt';

  const filter: Record<string, any> = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.paymentTier) {
    filter.paymentTier = query.paymentTier;
  }

  if (query.search && query.search.trim() !== '') {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    filter.$or = [
      { businessName: searchRegex },
      { contactPerson: searchRegex },
      { contactName: searchRegex },
      { email: searchRegex },
      { refCode: searchRegex },
      { instagram: searchRegex },
      { category: searchRegex },
    ];
  }

  const [vendors, total] = await Promise.all([
    Vendor.find(filter).sort(sortBy).skip(skip).limit(limit),
    Vendor.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    vendors,
    total,
    totalPages,
    currentPage: page,
    page,
  };
};

/**
 * Get single vendor by MongoDB _id OR refCode
 */
export const getVendorById = async (idOrRef: string): Promise<IVendor> => {
  const clean = idOrRef.trim();
  let vendor: IVendor | null = null;

  if (mongoose.isValidObjectId(clean)) {
    vendor = await Vendor.findById(clean);
  }

  if (!vendor) {
    vendor = await Vendor.findOne({ refCode: clean.toUpperCase() });
  }

  if (!vendor) {
    throw new ApiError(404, `Vendor with identifier "${clean}" not found`);
  }

  return vendor;
};

/**
 * Update vendor application review status and notes by MongoDB _id OR refCode
 */
export const updateVendorStatus = async (
  idOrRef: string,
  status: VendorStatus,
  notes?: string
): Promise<IVendor> => {
  const clean = idOrRef.trim();
  const updateData: Record<string, any> = { status };

  if (notes !== undefined) {
    updateData.notes = notes;
    updateData.curatorNotes = notes;
  }

  let vendor: IVendor | null = null;

  if (mongoose.isValidObjectId(clean)) {
    vendor = await Vendor.findByIdAndUpdate(clean, updateData, {
      new: true,
      runValidators: true,
    });
  }

  if (!vendor) {
    vendor = await Vendor.findOneAndUpdate(
      { refCode: clean.toUpperCase() },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );
  }

  if (!vendor) {
    throw new ApiError(404, `Vendor with identifier "${clean}" not found`);
  }

  return vendor;
};

/**
 * Get vendor aggregate stats matching exact admin dashboard metrics
 */
export const getVendorStats = async () => {
  const [
    total,
    approved,
    pending,
    waitlisted,
    rejected,
    catwalk,
    premium,
    standard,
    executive,
  ] = await Promise.all([
    Vendor.countDocuments(),
    Vendor.countDocuments({ status: 'approved' }),
    Vendor.countDocuments({ status: 'pending' }),
    Vendor.countDocuments({ status: 'waitlisted' }),
    Vendor.countDocuments({ status: 'rejected' }),
    Vendor.countDocuments({ paymentTier: 'catwalk' }),
    Vendor.countDocuments({ paymentTier: 'premium' }),
    Vendor.countDocuments({ paymentTier: 'standard' }),
    Vendor.countDocuments({ paymentTier: 'executive' }),
  ]);

  return {
    total,
    approved,
    pending,
    waitlisted,
    rejected,
    catwalk,
    premium,
    standard,
    executive,
  };
};
