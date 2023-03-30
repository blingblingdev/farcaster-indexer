import dotenv from "dotenv";
import { indexAllCasts } from "./job/index_casts";
import { indexAllReactions } from "./job/index_reactions";
dotenv.config();

const main = async () => {
  console.time("total");

  console.time("casts");
  await indexAllCasts();
  console.timeEnd("casts");

  // console.time("reactions");
  // await indexAllReactions();
  // console.timeEnd("reactions");

  console.timeEnd("total");
};

main();
