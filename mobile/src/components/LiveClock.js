import { useEffect, useState } from "react";
import { Text } from "react-native";

export default function LiveClock({ style }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <Text style={style}>
      {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
      {" · "}
      {now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })}
    </Text>
  );
}