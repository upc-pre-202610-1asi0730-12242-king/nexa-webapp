export class ColdChainOperation {
  constructor({ operationType, productCategories, minTemperature, maxTemperature, monthlyVolume }) {
    this.operationType = operationType;
    this.productCategories = productCategories;
    this.minTemperature = minTemperature;
    this.maxTemperature = maxTemperature;
    this.monthlyVolume = monthlyVolume;
  }
}
