import React, { useEffect, useState } from "react";
import supabase from "../supabaseClient";

function SubscriptionDashboard({ userId }) {
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    async function fetchSubscription() {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (!error) setSubscription(data);
    }
    fetchSubscription();
  }, [userId]);

  return (
    <div>
      <h2>My Subscription</h2>
      {subscription ? (
        <p>{subscription.plan} — {subscription.status}</p>
      ) : (
        <p>No active subscription</p>
      )}
    </div>
  );
}

export default SubscriptionDashboard;
