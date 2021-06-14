export default class EcmasonSerializeError extends Error {
  constructor(tag: string) {
    super(`value of tag "${tag}" cannot be deserialized`);
  }
}
