const multiWhitespaceRegex = new RegExp(/\s+/g);

const removeMultiWhitespace = (value: string) =>
  value.replace(multiWhitespaceRegex, " ").trim();

export default removeMultiWhitespace;
