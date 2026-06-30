class ApiFeatures {
  query: any;
  queryObj: any;
  constructor(query: any, queryObj: any) {
    this.query = query;
    this.queryObj = queryObj;
  }
  paginate() {
    const page = parseInt(this.queryObj.page as string) || 1;
    let limit = parseInt(this.queryObj.limit as string) || 10;
    if (limit > 100) limit = 100;
    // 10 10 10
    // 0  10 20
    let skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}
export default ApiFeatures;
