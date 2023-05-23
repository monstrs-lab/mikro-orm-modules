import type { QueryBuilder } from '@mikro-orm/postgresql'

import { Query }             from '@monstrs/query-types'
import set                   from 'lodash.set'
import isEmpty               from 'lodash.isempty'

export class MikroORMQueryBuilder<T extends object> {
  #take?: number

  constructor(private readonly qb: QueryBuilder<T>) {}

  order(order?: Query.Order) {
    if (order) {
      this.qb.orderBy({
        [order.field]: order.direction === Query.OrderDirection.ASC ? 'ASC' : 'DESC',
      })
    }

    return this
  }

  pager(pager?: Query.Pager) {
    if (pager?.take) {
      this.#take = pager.take + 1

      this.qb.limit(this.#take, pager?.offset || 0)
    }

    return this
  }

  search(fields?: Array<Query.SearchField>, value?: string) {
    if (value && fields && fields.length > 0) {
      this.qb.andWhere({
        $or: fields.map((field) =>
          set({}, field.path, {
            $ilike: value,
          })),
      })
    }

    return this
  }

  id(field: string, query?: Query.ID) {
    if (field && query?.conditions) {
      const conditions = Object.keys(query.conditions).filter(
        (condition) => !isEmpty(query.conditions![condition])
      )

      if (conditions.length === 1) {
        this.qb.andWhere({
          [field]: {
            [`$${conditions.at(0)!}`]: query.conditions[conditions.at(0)!],
          },
        })
      } else if (conditions.length > 1) {
        const condition =
          (query.operator || Query.Operator.AND) === Query.Operator.AND ? '$and' : '$or'

        this.qb.andWhere({
          [field]: {
            [condition]: Object.keys(query.conditions).map((key) => ({
              [`$${key}`]: query.conditions![key],
            })),
          },
        })
      }
    }

    return this
  }

  date(field: string, query?: Query.Date) {
    if (field && query?.conditions) {
      const conditions = Object.keys(query.conditions).filter(
        (condition) => !isEmpty(query.conditions![condition])
      )

      if (conditions.length === 1) {
        this.qb.andWhere({
          [field]: {
            [`$${conditions.at(0)!}`]: query.conditions[conditions.at(0)!],
          },
        })
      } else if (conditions.length > 1) {
        const condition =
          (query.operator || Query.Operator.AND) === Query.Operator.AND ? '$and' : '$or'

        this.qb.andWhere({
          [field]: {
            [condition]: Object.keys(query.conditions).map((key) => ({
              [`$${key}`]: query.conditions![key],
            })),
          },
        })
      }
    }

    return this
  }

  async execute(): Promise<[Array<T>, boolean]> {
    const result = await this.qb.getResultList()

    if (!this.#take) {
      return [result, false]
    }

    return [result.slice(0, this.#take - 1), result.length >= this.#take]
  }
}
