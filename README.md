# Farcaster Indexer

This is a [Farcaster](https://www.farcaster.xyz/) indexer build on [Merkle v2 API](https://farcasterxyz.notion.site/Merkle-v2-API-Documentation-c19a9494383a4ce0bd28db6d44d99ea8#160537d392b64d23b2fac59702046588).

## Quick Start

1. Follow the `.env.example` to create your own `.env` file.
2. Create tables in your MySQL database using [db.sql](https://github.com/ffy/farcaster-indexer/blob/master/db/db.sql).
3. Generate prisma models: `npx prisma generate`.
4. Build the project: `yarn build`.
5. Start Indexing: `yarn start`, and everything will be indexed incrementally every 30 minutes.

## Features

Here are all kinds of data can be indexed or in progress.

|Data Type|Status|
|-|-|
|User Profiles|Completed|
|Casts|Completed|
|Reactions|Completed|
|Follows|In Progress|
|Cast deletion|Planned|

You are more than welcome to submit a PR or open an issue.
