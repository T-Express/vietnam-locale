const districts = require("./data/district.json");
const wards = require("./data/ward.json");
const provinces = require("./data/province.json");

const keyBy = require("lodash.keyby");
const groupBy = require("lodash.groupBy");

const { matchSorter } = require("match-sorter");
const removeAccents = require("remove-accents");

const searchOptions = {
	keys: ["slug_name"],
	threshold: matchSorter.rankings.CONTAINS,
};

class VietnamLocale {
	constructor() {
		// === Province operation ====
		this.provincesByCode = keyBy(provinces, "code");

		// === District operation ====
		this.districtsByProvincecode = groupBy(districts, "province_code");
		this.districtByCode = keyBy(districts, "code");

		// === Ward operation ====
		this.wardsByProvinceAndDistrict = groupBy(wards, (item) => {
			return `${item.province_code}::${item.district_code}`;
		});
		this.wardsByDistrict = groupBy(wards, "district_code");
		this.wardsByProvince = groupBy(wards, "province_code");

		// raw data
		this.wards = wards;
		this.provinces = provinces;
		this.districts = districts;
	}

	search({ category, searchString, drillDown }) {
		if (category === "province") {
			return matchSorter(provinces, searchString, {
				keys: ["description", "slug_name"],
				threshold: matchSorter.rankings.CONTAINS,
			});
		} else if (category === "district") {
			if (drillDown.provinceCode) {
				return matchSorter(
					this.districtsByProvincecode[drillDown.provinceCode],
					searchString,
					searchOptions
				);
			}

			return matchSorter(districts, searchString, searchOptions);
		} else if (category === "ward") {
			if (drillDown.provinceCode && drillDown.districtCode) {
				return matchSorter(
					this.wardsByProvinceAndDistrict[
						`${drillDown.provinceCode}::${drillDown.districtCode}`
					],
					searchString,
					searchOptions
				);
			} else if (drillDown.provinceCode) {
				return matchSorter(
					this.wardsByProvince[drillDown.provinceCode],
					searchString,
					searchOptions
				);
			} else if (drillDown.districtCode) {
				return matchSorter(
					this.wardsByDistrict[drillDown.districtCode],
					searchString,
					searchOptions
				);
			}

			return matchSorter(wards, searchString, searchOptions);
		}
	}

	searchProvince(searchString) {
		const rawString = removeAccents(searchString);

		return this.search({
			category: "province",
			searchString: rawString,
		});
	}

	searchDistrict(searchString, provinceCode = "") {
		const rawString = removeAccents(searchString);

		return this.search({
			category: "district",
			searchString: rawString,
			drillDown: {
				provinceCode,
			},
		});
	}

	searchWard(searchString, districtCode = "", provinceCode = "") {
		const rawString = removeAccents(searchString);

		return this.search({
			category: "ward",
			searchString: rawString,
			drillDown: {
				districtCode,
				provinceCode,
			},
		});
	}
}

module.exports = {
	VietnamLocale,
};
