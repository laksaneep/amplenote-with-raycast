import { Action, ActionPanel, Form, Icon, List, Toast, showToast, useNavigation } from "@raycast/api";
import { useEffect, useState } from "react";
import * as amplenote from "./Authentication/amplenote";

interface Todo {
  title: string;
  isCompleted: boolean;
}

// Update the service name here for testing different providers
const serviceName = "amplenote";

export default function Command() {
  const service = getService(serviceName);
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    (async () => {
      try {
        await service.authorize();
      } catch (error) {
        console.error("--- Authorized error: ", error);
        showToast({ style: Toast.Style.Failure, title: String(error) });
      }
    })();
  }, [service]);

  function handleCreate(todo: Todo) {
    const newTodos = [...todos, todo];
    setTodos(newTodos);

    (async () => {
      try {
        await service.addNewTask(todo.title);
        showToast({ style: Toast.Style.Success, title: "Add new task success!!!" });
      } catch (error) {
        console.error("--- add new tasks error: ", error);
        showToast({ style: Toast.Style.Failure, title: String(error) });
      }
    })();
  }

  return (
    <List
      actions={
        <ActionPanel>
          <CreateTodoAction onCreate={handleCreate} />
        </ActionPanel>
      }
    >
      {todos.map((todo, index) => (
        <List.Item key={index} title={todo.title} />
      ))}
    </List>
  );
}

function CreateTodoForm(props: { onCreate: (todo: Todo) => void }) {
  const { pop } = useNavigation();

  function handleSubmit(values: { title: string }) {
    props.onCreate({ title: values.title, isCompleted: false });
    pop();
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Task" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="title" title="To-do" />
    </Form>
  );
}

function CreateTodoAction(props: { onCreate: (todo: Todo) => void }) {
  return (
    <Action.Push
      icon={Icon.Pencil}
      title="Create Todo"
      shortcut={{ modifiers: ["cmd"], key: "n" }}
      target={<CreateTodoForm onCreate={props.onCreate} />}
    />
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
  addNewTask(todo: string): Promise<void>;
}
