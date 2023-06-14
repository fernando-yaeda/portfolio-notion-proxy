import express, { json } from "express";
import { Client } from "@notionhq/client";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const port = process.env.PORT;
const authToken = process.env.NOTION_TOKEN;
const databaseId = process.env.NOTION_DATABASE_ID;
const notion = new Client({ auth: authToken });

const app = express();
app.use(cors());
app.use(json());

app.get("/database/query", async (req, res) => {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        and: [
          {
            property: "status",
            status: {
              equals: "Done",
            },
          },
        ],
      },
    });
    const results = response.results.map((res) => res.properties);

    const projects = results.map((project) => ({
      title: project.title.title[0].plain_text,
      description: project.description.rich_text[0].plain_text,
      techStack: project.techStack.multi_select.map((stack) => stack.name),
      imageUrl: project.image?.files[0]?.file?.url ?? null,
      detailsId: project.details?.relation?.map((detail) => detail.id ?? null),
    }));

    res.send({ projects });
  } catch (error) {
    res.send().status(400);
  }
});

app.get("/project/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const response = await notion.pages.retrieve({
      page_id: id,
    });

    const project = response.properties;
    const projectDetails = {
      title: project.title.title[0].text.content,
      paragraph: project.paragraph.rich_text[0].text.content,
      imageUrl: project.image.files[0].file.url,
    };

    res.send({ projectDetails });
  } catch (error) {
    res.send().status(400);
  }
});

app.listen(port, () => {
  console.log(`server listening on port ${port}`);
});
