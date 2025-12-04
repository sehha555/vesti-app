import rawData from '../data/taiwan-districts.json';

interface RawCounty {
  name: string;
  districts: { zip: string; name: string }[];
}

export interface TaiwanDistrict {
  county: string;
  district: string;
  zip: string;
}

const RAW_COUNTIES = rawData as RawCounty[];

export const TAIWAN_DISTRICTS: TaiwanDistrict[] = RAW_COUNTIES.flatMap(
  (county) =>
    county.districts.map((d) => ({
      county: county.name,
      district: d.name,
      zip: d.zip,
    }))
);

export function findDistrictByZip(zip: string): TaiwanDistrict | undefined {
  return TAIWAN_DISTRICTS.find((d) => d.zip === zip);
}
