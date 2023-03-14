// const sourcePath = process.cwd()

// const infos = JSON.parse(info);

// const files = fs.readdirSync(
//   "/home/ethan/learnspace/sourceCode/IconPark/packages/svg/src/icons",
//   "utf-8"
// );
import path from "path";
import fs from "fs";
import { globby, globbySync } from "globby";
// import translate from "@vitalets/google-translate-api";
import translate from "translate-google";
import { request, get } from "http";
import md5 from "md5";

const sourcePath = path.resolve() + "/remix-icon/icons/*/*.svg";
// const info = fs.readdirSync(sourcePath, "utf-8");
// const infos = fs.readFileSync(sourcePath, "utf-8");
// fs.readFile()
const paths = globbySync(sourcePath);

const contentHeader = `<?xml version="1.0" encoding="UTF-8"?>`;
const svgJson = {};

const asyncPath = (path) => {
  const matcher = path.match(/([^\/]*)\.svg/);
  if (matcher === null) {
    return true;
  } else {
    const pathSplit = path.split("/");
    const dirName = pathSplit[pathSplit.length - 2];
    let content = fs.readFileSync(path, "utf-8");
    const file = matcher[0];
    const key = file.split(".")[0];
    content = contentHeader + content;
    // content.replace(/<path d\=/g, "<path fill=\"' + props.size + '\" d=");
    let pathIndex = 0;
    content = content.replace(/<path/g, (match) => {
      pathIndex++;
      if (pathIndex === 2) {
        if (key.indexOf("-fill") > -1) {
          return match + ` fill="' + props.colors[1] + '" `;
        } else if (key.indexOf("-line") > -1) {
          return match + ` fill="' + props.colors[0] + '" `;
        } else {
          return match + ` fill="' + props.colors[0] + '" `;
        }
      } else {
        return match;
      }
    });

    const startIndex = content.indexOf("<?xml");
    const endIndex = content.indexOf("</svg>");
    const svgStr = content.substring(startIndex, endIndex + 7);
    svgJson[key] = {
      svg: svgStr,
      category: dirName,
    };
  }
};

const getChartsDics = (svgJson) => {
  let charts = [];

  Object.keys(svgJson).forEach((k) => {
    const maRes = k.match(
      /([a-z]+(\-([^fill][a-z]+))?)(?:\-[0-9])*(?:\-fill|line)?/
    );
    let val = k;
    if (maRes) {
      val = maRes[1];
    }
    charts.push(val);

    if (val.indexOf("-") > -1) {
      charts = charts.concat(val.split("-"));
    }
    if (svgJson[k]?.category) {
      charts.push(svgJson[k]?.category);
    }
  });
  charts = Array.from(new Set(charts));

  const q = charts.join("\n");
  const appid = "20220418001178924";
  const query = q;
  const salt = "1435660288";
  const secretKey = "X5iYtOPIleHJUfEs9QfD";
  const sign = md5(appid + query + salt + secretKey);
  const url = encodeURI(
    `http://api.fanyi.baidu.com/api/trans/vip/translate?q=${query}&from=en&to=zh&appid=${appid}&salt=${salt}&sign=${sign}`
  );
  return new Promise((resolve, reject) => {
    get(url, (res) => {
      res.setEncoding("utf8");
      let rawData = "";

      res.on("data", (chunk) => {
        rawData += chunk;
      });
      res.on("end", () => {
        try {
          const parsedData = JSON.parse(rawData);
          resolve(parsedData);
        } catch (e) {
          reject(e);
        }
      });
    });
  });
};

const updateDicts = async (svgJson) => {
  // 获取字符集
  const data = await getChartsDics(svgJson);
  // 写入字符集
  const buf = Buffer.from(JSON.stringify(data.trans_result));
  fs.writeFileSync("./remix-dict.json", buf, "utf-8");
  return data.trans_result;
};

const updateSvgJson = (svgJson, dict) => {
  if (!dict) {
    dict = JSON.parse(fs.readFileSync("./remix-dict.json", "utf-8"));
  }
  Object.keys(svgJson).forEach((k) => {
    const matcher = k.match(
      /([a-z]+(\-([^fill][a-z]+))?)(?:\-[0-9])*(?:\-fill|line)?/
    );
    if (!matcher) {
      throw new Error("error: " + k);
    }
    const realKey = matcher[1];
    const title = dict.find((d) => d.src === realKey)?.dst;
    const categoryCN = dict.find((d) => d.src === svgJson[k].category)?.dst;
    // TODO: 英文单词拆开后含义不同
    // const tag = dict
    //   .filter((d) => realKey.split("-").includes(d.src))
    //   .map((d) => d.dst);
    svgJson[k]["title"] = title;
    svgJson[k]["categoryCN"] = categoryCN;
    svgJson[k]["tag"] = [title].concat(realKey.split("-"));
  });
  const buf = Buffer.from(JSON.stringify(svgJson));
  fs.writeFileSync("./remix-icon.json", buf, "utf-8");
};

const run = async () => {
  paths.forEach((path) => asyncPath(path));
  // const dict =  await updateDicts(svgJson);
  updateSvgJson(svgJson);
  console.log(svgJson);
};

run();
