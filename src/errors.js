export class AuthError extends Error { constructor(m) { super(m); this.name = 'AuthError'; } }
export class ApiError extends Error { constructor(m) { super(m); this.name = 'ApiError'; } }
export class ImageError extends ApiError { constructor(m) { super(m); this.name = 'ImageError'; } }
export class GeminiError extends Error { constructor(m) { super(m); this.name = 'GeminiError'; } }
export class TimeoutError extends GeminiError { constructor(m) { super(m); this.name = 'TimeoutError'; } }
export class LimitError extends GeminiError { constructor(m) { super(m); this.name = 'LimitError'; } }
export class ModelError extends GeminiError { constructor(m) { super(m); this.name = 'ModelError'; } }
export class BlockedError extends GeminiError { constructor(m) { super(m); this.name = 'BlockedError'; } }
