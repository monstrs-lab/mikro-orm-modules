import type { Logger as ILogger }                from '@mikro-orm/core'
import type { LoggerNamespace }                  from '@mikro-orm/core'
import type { LogContext }                       from '@mikro-orm/core'
import type { LoggerOptions }                    from '@mikro-orm/core'
import type { LogAttributes }                    from '@monstrs/logger'

import { Logger }                                from '@monstrs/logger'

import { LOGGER_SQL_ATTRIBUTE_NAME }             from './mikro-orm.logger.constants.js'
import { LOGGER_PARAMS_ATTRIBUTE_NAME }          from './mikro-orm.logger.constants.js'
import { LOGGER_CONNECTION_TYPE_ATTRIBUTE_NAME } from './mikro-orm.logger.constants.js'
import { LOGGER_CONNECTION_NAME_ATTRIBUTE_NAME } from './mikro-orm.logger.constants.js'
import { LOGGER_TOOK_ATTRIBUTE_NAME }            from './mikro-orm.logger.constants.js'

export class MikroORMLogger implements ILogger {
  public debugMode = this.options.debugMode ?? false

  #logger: Logger = new Logger('mikro-orm')

  constructor(private readonly options: LoggerOptions) {}

  setDebugMode(debugMode: Array<LoggerNamespace> | boolean): void {
    this.debugMode = debugMode
  }

  isEnabled(namespace: LoggerNamespace): boolean {
    return (
      !!this.debugMode && (!Array.isArray(this.debugMode) || this.debugMode.includes(namespace))
    )
  }

  log(namespace: LoggerNamespace, message: string, context?: LogContext): void {
    if (!this.isEnabled(namespace)) {
      return
    }

    const msg = message.replace(/\n/g, '').replace(/ +/g, ' ').trim()

    const attributes: LogAttributes = {}

    if (context?.query) {
      attributes[LOGGER_SQL_ATTRIBUTE_NAME] = context.query
    }

    if (context?.params) {
      attributes[LOGGER_PARAMS_ATTRIBUTE_NAME] = context.params as Array<any>
    }

    if (context?.connection?.type) {
      attributes[LOGGER_CONNECTION_TYPE_ATTRIBUTE_NAME] = context.connection.type
    }

    if (context?.connection?.name) {
      attributes[LOGGER_CONNECTION_NAME_ATTRIBUTE_NAME] = context.connection.name
    }

    if (context?.took) {
      attributes[LOGGER_TOOK_ATTRIBUTE_NAME] = context.took
    }

    if (context?.level === 'error') {
      this.#logger.child(namespace).error(msg, attributes)
    } else if (context?.level === 'warning') {
      this.#logger.child(namespace).warn(msg, attributes)
    } else {
      this.#logger.child(namespace).info(msg, attributes)
    }
  }

  error(namespace: LoggerNamespace, message: string, context?: LogContext): void {
    this.log(namespace, message, { ...context, level: 'error' })
  }

  warn(namespace: LoggerNamespace, message: string, context?: LogContext): void {
    this.log(namespace, message, { ...context, level: 'warning' })
  }

  logQuery(context: LogContext & { query: string }): void {
    this.log('query', context.took ? `Exec query took ${context.took} ms` : 'Exec query', context)
  }
}
