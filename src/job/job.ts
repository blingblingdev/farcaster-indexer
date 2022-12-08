import { schedule } from "node-cron";
import { indexAllCasts } from "./index_casts";
import { indexAllReactions } from "./index_reactions";

const indexAllCastsJob = schedule("*/30 * * * *", indexAllCasts, {
  scheduled: false,
});
const indexAllReactionsJob = schedule("*/30 * * * *", indexAllReactions, {
  scheduled: false,
});

export const initJobs = async () => {
  indexAllCastsJob.start();
  indexAllReactionsJob.start();
};

export const stopJobs = () => {
  indexAllCastsJob.stop();
  indexAllReactionsJob.stop();
};
