const districts = require("./data/district.json");
const raw_wards = require("./data/ward.json");
const provinces = require("./data/province.json");

const keyBy = require("lodash.keyby");
const groupBy = require("lodash.groupby");

const { matchSorter } = require("match-sorter");

const searchOptions = {
	keys: ["slug_name"],
	threshold: matchSorter.rankings.CONTAINS,
};

// This function keeps the casing unchanged for str, then perform the conversion
function toNonAccentVietnamese(str) {
	str = str.replace(/À|Ả|Ã|Á|Ạ|A|Ầ|Ẩ|Ẫ|Ấ|Ậ|Â|Ằ|Ẳ|Ẵ|Ắ|Ặ|Ă/g, "A");
	str = str.replace(/à|ả|ã|á|ạ|a|ầ|ẩ|ẫ|ấ|ậ|â|ằ|ẳ|ẵ|ắ|ặ|ă/g, "a");
	str = str.replace(/È|Ẻ|Ẽ|É|Ẹ|E|Ề|Ể|Ễ|Ế|Ệ|Ê/, "E");
	str = str.replace(/è|ẻ|ẽ|é|ẹ|e|ề|ể|ễ|ế|ệ|ê/g, "e");
	str = str.replace(/Ì|Ỉ|Ĩ|Í|Ị|I/g, "I");
	str = str.replace(/ì|ỉ|ĩ|í|ị|i/g, "i");
	str = str.replace(/Ò|Ỏ|Õ|Ó|Ọ|O|Ồ|Ổ|Ỗ|Ố|Ộ|Ô|Ờ|Ở|Ỡ|Ớ|Ợ|Ơ/g, "O");
	str = str.replace(/ò|ỏ|õ|ó|ọ|o|ồ|ổ|ỗ|ố|ộ|ô|ờ|ở|ỡ|ớ|ợ|ơ/g, "o");
	str = str.replace(/Ù|Ủ|Ũ|Ú|Ụ|U|Ừ|Ử|Ữ|Ứ|Ự|Ư/g, "U");
	str = str.replace(/ù|ủ|ũ|ú|ụ|u|ừ|ử|ữ|ứ|ự|ư/g, "u");
	str = str.replace(/Ỳ|Ỷ|Ỹ|Ý|Ỵ|Y/g, "Y");
	str = str.replace(/ỳ|ỷ|ỹ|ý|ỵ|y/g, "y");
	str = str.replace(/Đ/g, "D");
	str = str.replace(/đ/g, "d");
	// Some system encode vietnamese combining accent as individual utf-8 characters
	str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // Huyền sắc hỏi ngã nặng
	str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ê, Ă, Ơ, Ư
	return str;
}

// This function converts the string to lowercase, then perform the conversion
function toLowerCaseNonAccentVietnamese(str) {
	str = str.toLowerCase();
	return toNonAccentVietnamese(str);
}


const utils = {
	removeAccents: toNonAccentVietnamese,
	toLowerCaseAndRemoveAccents: toLowerCaseNonAccentVietnamese,
};

const enhanceWards = (wards, districtsByCode, provincesByCode) => {
	return wards.map((w) => {
		let detail = `${w.name}, ${districtsByCode[w.district_code].description}, ${
			provincesByCode[w.province_code].description
		}`;
		let raw_detail = toNonAccentVietnamese(detail.replace(/,/g, ""));

		w["detail"] = detail;
		w["raw_detail"] = raw_detail;

		return w;
	});
};

class VietnamLocale {
	constructor() {
		// === Province operation ====
		this.provincesByCode = keyBy(provinces, "code");

		// === District operation ====
		this.districtsByProvincecode = groupBy(districts, "province_code");
		this.districtsByCode = keyBy(districts, "code");

		const wards = enhanceWards(
			raw_wards,
			this.districtsByCode,
			this.provincesByCode
		);

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
			return matchSorter(this.provinces, searchString, {
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

			return matchSorter(this.districts, searchString, searchOptions);
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

			return matchSorter(this.wards, searchString, searchOptions);
		}
	}

	searchProvince(searchString) {
		const rawString = utils.removeAccents(searchString);

		return this.search({
			category: "province",
			searchString: rawString,
		});
	}

	searchDistrict(searchString, provinceCode = "") {
		const rawString = utils.removeAccents(searchString);

		return this.search({
			category: "district",
			searchString: rawString,
			drillDown: {
				provinceCode,
			},
		});
	}

	searchWard(searchString, districtCode = "", provinceCode = "") {
		const rawString = utils.removeAccents(searchString);

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
	utils,
};
