## Command

```bash
$ gpm clean|cl [options]
```

clear temp cache，at the same time it will trigger [relink](/relink)

## Help Information

```bash
$ gpm help clean

   gpm 6.1.0 - Git Package Manager, make you manage the repository easier

   USAGE

     gpm clean

   OPTIONS

     -u, --unixify      Output the path as unix style, useful in Windows Git bash      optional
     -f, --force        Forced mode, skip the question                                 optional
     --nolog            Don't not display any log                                      optional

   GLOBAL OPTIONS

     -h, --help         Display help
     -V, --version      Display version
     --no-color         Disable colors
     --quiet            Quiet mode - only displays warn and error messages
     -v, --verbose      Verbose mode - will also output debug messages
```

## Options

- -u, --unixify

Output the path as unix style, useful in Windows Git bash

- -f, --force

Forced mode, skip the question

- --nolog

Don't not display any log

## Example

#### clear cache

```bash
$ gpm clean
```