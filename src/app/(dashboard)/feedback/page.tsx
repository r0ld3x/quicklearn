import { getServerUser, getServerFeedbacks } from "@/lib/server-data";
import { FeedbackClient } from "./_components/feedback-client";

export default async function FeedbackPage() {
  const user = await getServerUser();
  const feedbacks = user ? await getServerFeedbacks(user.id) : [];

  return <FeedbackClient initialFeedbacks={feedbacks} />;
}
