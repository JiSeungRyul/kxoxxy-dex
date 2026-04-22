export class NextRequest extends Request {}

export class NextResponse extends Response {
  static json(body, init) {
    return Response.json(body, init);
  }
}
