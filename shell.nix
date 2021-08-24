{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
      nodejs-16_x
  ];
  shellHook = ''
    PATH="$PWD"/workspaces/type-explorer/bin:"$PATH"
  '';
}
