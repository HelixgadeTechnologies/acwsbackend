/**
 * Standardised API response wrapper.
 *
 * Usage:
 *   res.status(200).json(new ApiResponse(200, data, 'Items fetched'));
 */
class ApiResponse<T = unknown> {
  public readonly success: boolean;
  public readonly statusCode: number;
  public readonly message: string;
  public readonly data: T | null;

  constructor(statusCode: number, data: T | null, message: string = 'Success') {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}

export default ApiResponse;
