/** @fileoverview General helpers, kept local so the package reaches nothing of its host's. */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Joins class names, with a later Tailwind class winning over a clashing earlier one. */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
