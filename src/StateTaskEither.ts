import { Either } from 'fp-ts/lib/Either'
import { Monad3 } from 'fp-ts/lib/Monad'
import { State } from 'fp-ts/lib/State'
import * as stateT from 'fp-ts/lib/StateT'
import { TaskEither, taskEither } from 'fp-ts/lib/TaskEither'
import { Endomorphism } from 'fp-ts/lib/function'

declare module 'fp-ts/lib/HKT' {
  interface URI2HKT3<U, L, A> {
    StateTaskEither: StateTaskEither<U, L, A>
  }
}

const T = stateT.getStateT2v(taskEither)

export const URI = 'StateTaskEither'

export type URI = typeof URI

export class StateTaskEither<S, L, A> {
  readonly _A!: A
  readonly _L!: L
  readonly _U!: S
  readonly _URI!: URI
  constructor(readonly value: (s: S) => TaskEither<L, [A, S]>) {}
  run(s: S): Promise<Either<L, [A, S]>> {
    return this.value(s).run()
  }
  eval(s: S): Promise<Either<L, A>> {
    return this.run(s).then(e => e.map(([a]) => a))
  }
  exec(s: S): Promise<Either<L, S>> {
    return this.run(s).then(e => e.map(([_, s]) => s))
  }
  map<B>(f: (a: A) => B): StateTaskEither<S, L, B> {
    return new StateTaskEither(T.map(this.value, f))
  }
  ap<B>(fab: StateTaskEither<S, L, (a: A) => B>): StateTaskEither<S, L, B> {
    return new StateTaskEither(T.ap(fab.value, this.value))
  }
  ap_<B, C>(this: StateTaskEither<S, L, (b: B) => C>, fb: StateTaskEither<S, L, B>): StateTaskEither<S, L, C> {
    return fb.ap(this)
  }
  chain<B>(f: (a: A) => StateTaskEither<S, L, B>): StateTaskEither<S, L, B> {
    return new StateTaskEither(T.chain(this.value, a => f(a).value))
  }
  orElse<M>(f: (l: L) => StateTaskEither<S, M, A>): StateTaskEither<S, M, A> {
    return new StateTaskEither(s => this.value(s).orElse(l => f(l).value(s)))
  }
}

const map = <S, L, A, B>(fa: StateTaskEither<S, L, A>, f: (a: A) => B): StateTaskEither<S, L, B> => fa.map(f)

const of = <S, L, A>(a: A): StateTaskEither<S, L, A> => new StateTaskEither(T.of(a))

const ap = <S, L, A, B>(
  fab: StateTaskEither<S, L, (a: A) => B>,
  fa: StateTaskEither<S, L, A>
): StateTaskEither<S, L, B> => fa.ap(fab)

const chain = <S, L, A, B>(
  fa: StateTaskEither<S, L, A>,
  f: (a: A) => StateTaskEither<S, L, B>
): StateTaskEither<S, L, B> => fa.chain(f)

const getT = stateT.get2v(taskEither)
export const get = <L, S>(): StateTaskEither<S, L, S> => new StateTaskEither<S, L, S>(getT)

const putT = stateT.put(taskEither)
export const put = <L, S>(s: S): StateTaskEither<S, L, void> => {
  return new StateTaskEither<S, L, void>(putT(s))
}

const modifyT = stateT.modify(taskEither)
export const modify = <L, S>(f: Endomorphism<S>): StateTaskEither<S, L, void> => {
  return new StateTaskEither<S, L, void>(modifyT(f))
}

const getsT = stateT.gets(taskEither)
export const gets = <S, L, A>(f: (s: S) => A): StateTaskEither<S, L, A> => {
  return new StateTaskEither<S, L, A>(getsT(f))
}

const liftT = stateT.liftF(taskEither)
export const fromTaskEither = <S, L, A>(fa: TaskEither<L, A>): StateTaskEither<S, L, A> => {
  return new StateTaskEither(liftT(fa))
}

const fromStateT = stateT.fromState(taskEither)
export const fromState = <S, A, L>(fa: State<S, A>): StateTaskEither<S, L, A> => {
  return new StateTaskEither(fromStateT(fa))
}

export const stateTaskEither: Monad3<URI> = {
  URI,
  map,
  of,
  ap,
  chain
}
