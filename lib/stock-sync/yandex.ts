const API_BASE = "https://cloud-api.yandex.net/v1/disk";

type YandexResource = {
  name: string;
  path: string;
  type: "file" | "dir";
  modified?: string;
  size?: number;
};

type ResourceList = {
  _embedded?: { items?: YandexResource[] };
};

type DownloadLink = { href?: string };

async function yandexRequest<T>(path: string, token: string) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `OAuth ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Yandex Disk API: HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function findLatestStockWorkbook(
  token: string,
  directory: string,
  publicKey?: string
) {
  const fields = "_embedded.items.name,_embedded.items.path,_embedded.items.type,_embedded.items.modified,_embedded.items.size";
  const params = new URLSearchParams({
    path: directory,
    limit: "200",
    fields,
  });
  if (publicKey) params.set("public_key", publicKey);
  const endpoint = publicKey ? "/public/resources" : "/resources";
  const resource = await yandexRequest<ResourceList>(
    `${endpoint}?${params}`,
    token
  );

  const candidates = (resource._embedded?.items ?? [])
    .filter((item) => item.type === "file")
    .filter((item) => /^PQ for dealers_\d{8}\.xlsx$/i.test(item.name))
    .sort((a, b) => b.name.localeCompare(a.name));

  const latest = candidates[0];
  if (!latest) throw new Error("В папке Яндекс Диска не найден файл PQ for dealers_YYYYMMDD.xlsx");
  return latest;
}

export async function downloadYandexFile(
  token: string,
  path: string,
  publicKey?: string
) {
  const params = new URLSearchParams({ path });
  if (publicKey) params.set("public_key", publicKey);
  const endpoint = publicKey ? "/public/resources/download" : "/resources/download";
  const link = await yandexRequest<DownloadLink>(
    `${endpoint}?${params}`,
    token
  );
  if (!link.href) throw new Error("Yandex Disk API не вернул ссылку скачивания");

  const response = await fetch(link.href, { cache: "no-store" });
  if (!response.ok) throw new Error(`Не удалось скачать XLSX: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}
