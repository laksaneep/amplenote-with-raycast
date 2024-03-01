import { List, Detail, Toast, showToast, Icon } from "@raycast/api";
import { useState, useEffect } from "react";
import * as amplenote from "./Authentication/amplenote";

// Update the service name here for testing different providers
const serviceName = "amplenote";

export default function Command() {
  const service = getService(serviceName);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [items, setItems] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        await service.authorize();
        const fetchedItems = await service.fetchItems();
        setItems(fetchedItems);
        setIsLoading(false);
      } catch (error) {
        console.error("----fetchToken error: ", error);
        setIsLoading(false);
        showToast({ style: Toast.Style.Failure, title: String(error) });
      }
    })();
  }, [service]);

  if (isLoading) {
    return <Detail isLoading={isLoading} />;
  }

  return (
    <List isLoading={isLoading}>
      {items.map((item) => {
        return <List.Item key={item.id} id={item.id} title={item.title} />;
      })}
    </List>
  );
}

// Services

function getService(serviceName: string): Service {
  switch (serviceName) {
    case "amplenote":
      return amplenote as Service;
    default:
      throw new Error("Unsupported service: " + serviceName);
  }
}

interface Service {
  authorize(): Promise<void>;
  fetchItems(): Promise<{ id: string; title: string }[]>;
  // addNewTask(): Promise<void>;
}
