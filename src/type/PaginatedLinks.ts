import { LinkItem } from "./LinkItem";

export interface PaginatedLinks {
    items: LinkItem[];
    total: number;
    page: number;
    totalPages: number;
}
