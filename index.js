const districts = require("./data/district.json");
const raw_wards = require("./data/ward.json");
const provinces = require("./data/province.json");

const keyBy = require("lodash.keyby");
const groupBy = require("lodash.groupBy");

const { matchSorter } = require("match-sorter");

const searchOptions = {
	keys: ["slug_name"],
	threshold: matchSorter.rankings.CONTAINS,
};

// This function converts the string to lowercase, then perform the conversion
function toLowerCaseNonAccentVietnamese(str) {
	str = str.toLowerCase();
	//     We can also use this instead of from line 11 to line 17
	//     str = str.replace(/\u00E0|\u00E1|\u1EA1|\u1EA3|\u00E3|\u00E2|\u1EA7|\u1EA5|\u1EAD|\u1EA9|\u1EAB|\u0103|\u1EB1|\u1EAF|\u1EB7|\u1EB3|\u1EB5/g, "a");
	//     str = str.replace(/\u00E8|\u00E9|\u1EB9|\u1EBB|\u1EBD|\u00EA|\u1EC1|\u1EBF|\u1EC7|\u1EC3|\u1EC5/g, "e");
	//     str = str.replace(/\u00EC|\u00ED|\u1ECB|\u1EC9|\u0129/g, "i");
	//     str = str.replace(/\u00F2|\u00F3|\u1ECD|\u1ECF|\u00F5|\u00F4|\u1ED3|\u1ED1|\u1ED9|\u1ED5|\u1ED7|\u01A1|\u1EDD|\u1EDB|\u1EE3|\u1EDF|\u1EE1/g, "o");
	//     str = str.replace(/\u00F9|\u00FA|\u1EE5|\u1EE7|\u0169|\u01B0|\u1EEB|\u1EE9|\u1EF1|\u1EED|\u1EEF/g, "u");
	//     str = str.replace(/\u1EF3|\u00FD|\u1EF5|\u1EF7|\u1EF9/g, "y");
	//     str = str.replace(/\u0111/g, "d");
	str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
	str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
	str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
	str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
	str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
	str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
	str = str.replace(/đ/g, "d");
	// Some system encode vietnamese combining accent as individual utf-8 characters
	str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // Huyền sắc hỏi ngã nặng
	str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ê, Ă, Ơ, Ư
	return str;
}

// This function keeps the casing unchanged for str, then perform the conversion
function toNonAccentVietnamese(str) {
	str = str.replace(/A|Á|À|Ã|Ạ|Â|Ấ|Ầ|Ẫ|Ậ|Ă|Ắ|Ằ|Ẵ|Ặ/g, "A");
	str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
	str = str.replace(/E|É|È|Ẽ|Ẹ|Ê|Ế|Ề|Ễ|Ệ/, "E");
	str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
	str = str.replace(/I|Í|Ì|Ĩ|Ị/g, "I");
	str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
	str = str.replace(/O|Ó|Ò|Õ|Ọ|Ô|Ố|Ồ|Ỗ|Ộ|Ơ|Ớ|Ờ|Ỡ|Ợ/g, "O");
	str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
	str = str.replace(/U|Ú|Ù|Ũ|Ụ|Ư|Ứ|Ừ|Ữ|Ự/g, "U");
	str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
	str = str.replace(/Y|Ý|Ỳ|Ỹ|Ỵ/g, "Y");
	str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
	str = str.replace(/Đ/g, "D");
	str = str.replace(/đ/g, "d");
	// Some system encode vietnamese combining accent as individual utf-8 characters
	str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // Huyền sắc hỏi ngã nặng
	str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ê, Ă, Ơ, Ư
	return str;
}

const utils = {
	removeAccents: toNonAccentVietnamese,
	toLowerCaseAndRemoveAccents: toLowerCaseNonAccentVietnamese,
};

const enhanceWards = (wards, districtsByCode, provincesByCode) => {
	let detail = `${w.name}, ${districtsByCode[w.district_code].name}, ${
		provincesByCode[w.province_code].description
	}`;

	let raw_detail = toNonAccentVietnamese(detail);
	return wards.map((w) => {
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
