class ApiFeature {
  constructor(tour, query) {
    this.tour = tour;
    this.query = query;
  }
  //-------------- filter --------------
  filter() {
    let query = { ...this.query };
    const exclude_fileds = ["limit", "sort", "page", "field"];
    Object.keys(query).forEach((key) => {
      if (exclude_fileds.includes(key)) {
        delete query[key];
      }
    });
    const Strquery = JSON.stringify(query).replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );
    this.tour = this.tour.find(JSON.parse(Strquery));
    return this;
  }
  //-------------- Sort --------------
  sort() {
    if (this.query.sort) {
      let sortBy = this.query.sort.replace(",", " ");
      this.tour = this.tour.sort(sortBy);
    } else {
      return this;
    }
    return this;
  }
  //-------------- Select --------------
  field() {
    if (this.query.field) {
      let selection = this.query.field.replace(",", " ");
      this.tour = this.tour.select(selection);
    } else {
      return this;
    }
    return this;
  }
  //-------------- paginate --------------
  paginate() {
    const limit = this.query.limit;
    const page = this.query.page;
    const skip = (page - 1) * limit;
    this.tour = this.tour.skip(skip).limit(limit);
    return this;
  }
}

module.exports = ApiFeature;
