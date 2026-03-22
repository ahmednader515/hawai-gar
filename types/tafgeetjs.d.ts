declare module "tafgeetjs" {
  class Tafgeet {
    constructor(digit: number | string, currency?: string);
    parse(): string;
  }
  export default Tafgeet;
}
