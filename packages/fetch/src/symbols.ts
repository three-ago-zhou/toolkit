const createSymbol = (name: string) => Symbol.for(`@@creams-fetch/${name}`);

export const CANCEL = createSymbol('CANCEL_PROMISE');
export const HELPER = createSymbol('HELPER');