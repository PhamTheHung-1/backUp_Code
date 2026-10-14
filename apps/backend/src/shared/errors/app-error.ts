export class AppError extends Error {
	constructor(
		public readonly statusCode: number,
		message: string,
		public readonly code: string = "APP_ERROR",
	) {
		super(message);
		this.name = "AppError";
	}

	static notFound(message = "Not found") {
		return new AppError(404, message, "NOT_FOUND");
	}

	static unauthorized(message = "Unauthorized") {
		return new AppError(401, message, "UNAUTHORIZED");
	}

	static forbidden(message = "Forbidden") {
		return new AppError(403, message, "FORBIDDEN");
	}

	static badRequest(message = "Bad request") {
		return new AppError(400, message, "BAD_REQUEST");
	}

	static internal(message = "Internal server error") {
		return new AppError(500, message, "INTERNAL_ERROR");
	}
}
