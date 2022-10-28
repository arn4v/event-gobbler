# @initflow/event-gobbler

This package contains the event ingestion routes and the core Clickhouse logic. It can be used as a Fastify plugin or as a standalone server.

## Event Schema

```ts
type ISO8601String = stringb;

export interface EventPayloadSchema {
  $type: "$identify";
  $event: "User Signed Up";
  $captured_at: ISO8601String;
  $user_id: string;
  $properties: DefaultProperties & {
    [key: string]: any;
  };
}
```

## Identify Schema

```ts
type ISO8601String = stringb;

type UserTraits = {
  email: string;
} & (
  | {
      $firstName: string;
      $lastName: string;
    }
  | {
      $name: string;
    }
);

export interface IdentifyPayloadSchema {
  $type: "$identify";
  $captured_at: ISO8601String;
  $user_id: string;
  $properties: UserTraits &
    DefaultProperties & {
      [key: string]: any;
    };
}
```

## Default Properties

Properties that are added to every event by the SDK.

```ts
// Default properties captured by SDK on identify/track call
type DefaultProperties = {
  $browser: string;
  $browser_version: string;
  $os: string;
  $url: string;
};
```
