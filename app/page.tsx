import wr2 from "../designs/wr-2.values.json";
import { checkPreview, fieldGuides } from "./api/datasheet";
import Studio from "./studio";

export default async function Home() {
  const initial = await checkPreview(wr2.values, "a4");
  return <Studio initial={initial} guides={fieldGuides()} />;
}
