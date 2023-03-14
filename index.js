import fs from "fs";
import rimraf from "rimraf";

// rimraf.sync("./dist/");

// 分类\标签 相关配置

const info = fs.readFileSync(
  "/home/ethan/learnspace/sourceCode/IconPark/packages/svg/icons.json",
  "utf-8"
);

const infos = JSON.parse(info);

const files = fs.readdirSync(
  "/home/ethan/learnspace/sourceCode/IconPark/packages/svg/src/icons",
  "utf-8"
);

const svgJson = {};
files.forEach((file) => {
  const content = fs.readFileSync(
    "/home/ethan/learnspace/sourceCode/IconPark/packages/svg/src/icons/" + file,
    "utf-8"
  );
  const key = file
    .split(".")[0]
    .replace(/([A-Z])/g, "-$1")
    .toLowerCase()
    .substring(1);
  const startIndex = content.indexOf("'<?xml");
  const endIndex = content.indexOf("</svg>'");
  const svgStr = content.substring(startIndex, endIndex + 7);
  if (content.indexOf("IconWrapper") > -1) {
    svgJson[key] = {
      svg: svgStr,
    };

    // info
    const _info = infos.find((i) => i.name === key);

    if (_info) {
      svgJson[key]["category"] = _info.category;
      svgJson[key]["categoryCN"] = _info.categoryCN;
      svgJson[key]["tag"] = _info.tag;
      svgJson[key]["title"] = _info.title;
    }
  }
});
const buf = Buffer.from(JSON.stringify(svgJson));
// const res = `const svgJson = ${buf}`;
fs.writeFileSync("./test.json", buf, "utf-8");
