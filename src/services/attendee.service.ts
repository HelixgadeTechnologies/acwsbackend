import mongoose from 'mongoose';
import Attendee, { generateAttendeeRefCode } from '../models/attendee.model';
import ApiError from '../utils/ApiError';
import {
  AttendeeQueryFilters,
  CreateAttendeeInput,
  IAttendee,
} from '../interfaces/attendee.interface';

/**
 * Fetch paginated list of attendees with search and filtering for Admin
 */
export const getAdminAttendees = async (
  query: AttendeeQueryFilters
): Promise<{ attendees: IAttendee[]; total: number; page: number; totalPages: number }> => {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || '-registeredAt';

  const filter: Record<string, any> = {};

  if (query.ticketType) {
    filter.ticketType = query.ticketType;
  }

  if (query.checkedIn !== undefined && query.checkedIn !== '') {
    filter.checkedIn = query.checkedIn === true || query.checkedIn === 'true';
  }

  if (query.search && query.search.trim() !== '') {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    filter.$or = [
      { fullName: searchRegex },
      { partnerName: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { refCode: searchRegex },
    ];
  }

  const [attendees, total] = await Promise.all([
    Attendee.find(filter).sort(sortBy).skip(skip).limit(limit),
    Attendee.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    attendees,
    total,
    page,
    totalPages,
  };
};

/**
 * Toggle or explicitly set attendee check-in status by MongoDB _id OR refCode
 */
export const checkinAttendee = async (
  idOrRef: string,
  explicitStatus?: boolean
): Promise<IAttendee> => {
  const clean = idOrRef.trim();
  let attendee: IAttendee | null = null;

  if (mongoose.isValidObjectId(clean)) {
    attendee = await Attendee.findById(clean);
  }

  if (!attendee) {
    attendee = await Attendee.findOne({ refCode: clean.toUpperCase() });
  }

  if (!attendee) {
    throw new ApiError(404, `Attendee with identifier "${clean}" not found`);
  }

  if (explicitStatus !== undefined) {
    attendee.checkedIn = Boolean(explicitStatus);
  } else {
    attendee.checkedIn = !attendee.checkedIn;
  }

  attendee.checkedInAt = attendee.checkedIn ? new Date() : null;
  await attendee.save();

  return attendee;
};

/**
 * Batch import attendees (e.g. from CSV / Eventbrite / external ticket system)
 */
export const batchImportAttendees = async (
  attendees: CreateAttendeeInput[]
): Promise<{ count: number }> => {
  if (!Array.isArray(attendees) || attendees.length === 0) {
    throw new ApiError(400, 'Attendees array must contain at least one attendee');
  }

  const docs = attendees.map((item) => ({
    ...item,
    refCode: item.refCode ? item.refCode.toUpperCase().trim() : generateAttendeeRefCode(),
    fullName: item.fullName || 'Anonymous Guest',
    email: item.email ? item.email.toLowerCase().trim() : '',
    ticketType: item.ticketType || 'standard',
    paymentStatus: item.paymentStatus || 'paid',
    pricePaid: typeof item.pricePaid === 'number' ? item.pricePaid : 0,
    fastTrackPass: Boolean(item.fastTrackPass),
    checkedIn: Boolean(item.checkedIn),
    registeredAt: new Date(),
  }));

  const inserted = await Attendee.insertMany(docs);

  return {
    count: inserted.length,
  };
};
