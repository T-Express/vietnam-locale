const { VietnamLocale } = require("../index");
const vnLocale = new VietnamLocale();
const { expect } = require("chai");
const provinces = require("../data/province.json");

let hcm = provinces.find((p) => {
	return p.slug_name === "Ho Chi Minh";
});
let q3 = "Quan 3";

describe("Test Basic Functionality", () => {
	describe("province", () => {
		it("key by code", () => {
			expect(vnLocale.provincesByCode[hcm.code]).to.be.an("object");
			expect(vnLocale.provincesByCode[hcm.code].name).to.be.eq("Hồ Chí Minh");
		});

		it("group by code", () => {
			const districtInHcm = vnLocale.districtsByProvincecode[hcm.code];
			expect(districtInHcm).to.be.an("array");
			expect(districtInHcm.find((d) => d.slug_name === q3)).to.be.an("object");
		});
	});

	describe("ward groupby district and province", () => {
		it("join key grouping", () => {
			const districtInHcm = vnLocale.districtsByProvincecode[hcm.code];
			const district3 = districtInHcm.find((d) => d.slug_name === q3);

			const wardsInDistrict3 =
				vnLocale.wardsByProvinceAndDistrict[`${hcm.code}::${district3.code}`];

			expect(wardsInDistrict3).to.be.an("array");
			const p5 = wardsInDistrict3.find((w) => {
				return w.slug_name === "Phuong 5";
			});

			expect(p5).to.be.an("object");
			expect(p5.name).to.be.eq("Phường 5");
		});
	});

	describe("Search", () => {
		it("search province", () => {
			const shouldIncludeHcm = vnLocale.searchProvince("ho");
			const hcmCity = shouldIncludeHcm.find((item) => {
				return item.slug_name === hcm.slug_name;
			});
			expect(hcmCity).to.be.an("object");
			expect(hcmCity.code).to.be.eq(hcm.code);
		});

		it("search district", () => {
			const shouldIncludeHcmAsProvince = vnLocale.searchDistrict(q3);
			const quan3 = shouldIncludeHcmAsProvince.find((item) => {
				return item.province_code === hcm.code;
			});

			expect(quan3).to.be.an("object");
		});

		it("search district with drill_down", () => {
			const moreProvince = vnLocale.searchDistrict("quan");
			const lessProvince = vnLocale.searchDistrict("quan", hcm.code);

			const quan3 = moreProvince.find((item) => {
				return item.province_code === hcm.code;
			});

			const quan3_compare = lessProvince.find((item) => {
				return item.province_code === hcm.code;
			});

			expect(moreProvince.length).to.be.gt(lessProvince.length);
			expect(quan3).to.be.deep.equal(quan3_compare);
		});

		it("search ward with drill_down", () => {
			const quan3 = vnLocale.districtsByProvincecode[hcm.code].find((item) => {
				return item.slug_name === "Quan 3";
			});

			const allWards = vnLocale.searchWard("phuong 3");

			const allWardsByHcm = vnLocale.searchWard("phuong 3", quan3.code);
			const allWardsByHcmQ3 = vnLocale.searchWard(
				"phuong 3",
				quan3.code,
				hcm.code
			);

			expect(allWards.length).to.be.gt(1); // ward can be repeated in Vietnam locale
			expect(allWards[0].detail).to.be.a.string; // ward can be repeated in Vietnam locale
			expect(allWards.length).to.be.gt(allWardsByHcm.length);
			expect(allWardsByHcm.length).to.be.gte(allWardsByHcmQ3.length);
		});
	});
});
