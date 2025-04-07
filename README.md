What I did so far:

1. Downloaded a packed `exe` from https://dl.diffchecker.com/Diffchecker%20Setup%206.3.2.exe.
1. Extracted the `asar` archive using 7zip.
1. Executed the following one-liner to populate `out-source-map`:

```ps1
ls -Recurse "C:\Users\USER\Projects\Diffchecker\out\**\*.js.map" |% {uv run "C:\Users\USER\Projects\unwebpack-sourcemap\unwebpack_sourcemap.py" --local $_ "C:\Users\USER\Projects\Diffchecker\out-source-map" --make-directory}
```
