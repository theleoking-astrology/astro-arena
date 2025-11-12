#!/bin/sh
if [ -z "$husky_skip_init" ]; then
  if [ "$HUSKY_DEBUG" = "1" ]; then
    set -x
  fi
  export husky_skip_init=1
  sh -e "$0" "$@"
  exit $?
fi


