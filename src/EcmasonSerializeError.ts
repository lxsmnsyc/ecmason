export default class EcmasonSerializeError<T> extends Error {
  readonly value: T;

  constructor(value: T) {
    super('Failed to serialize value');
    this.value = value;
  }
}
