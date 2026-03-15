import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  // We strictly use English for MVP per D1
  const locale = "en";

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
