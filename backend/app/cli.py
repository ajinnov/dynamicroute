import typer
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models import User

app = typer.Typer()

@app.command()
def create_user(
    username: str = typer.Argument(..., help="Nom d'utilisateur"),
    email: str = typer.Argument(..., help="Adresse email"),
    password: str = typer.Option(..., prompt=True, hide_input=True, help="Mot de passe")
):
    """Créer un nouvel utilisateur"""
    db = SessionLocal()
    try:
        # Vérifier si l'utilisateur existe déjà
        if db.query(User).filter(User.username == username).first():
            typer.echo(f"❌ L'utilisateur '{username}' existe déjà", err=True)
            raise typer.Exit(1)
        
        if db.query(User).filter(User.email == email).first():
            typer.echo(f"❌ L'email '{email}' est déjà utilisé", err=True)
            raise typer.Exit(1)
        
        # Créer l'utilisateur
        hashed_password = get_password_hash(password)
        user = User(
            username=username,
            email=email,
            hashed_password=hashed_password
        )
        db.add(user)
        db.commit()
        
        typer.echo(f"✅ Utilisateur '{username}' créé avec succès!")
        
    except Exception as e:
        typer.echo(f"❌ Erreur lors de la création: {str(e)}", err=True)
        raise typer.Exit(1)
    finally:
        db.close()

@app.command()
def list_users():
    """Lister tous les utilisateurs"""
    db = SessionLocal()
    try:
        users = db.query(User).all()
        if not users:
            typer.echo("Aucun utilisateur trouvé")
            return
        
        typer.echo("\n📋 Liste des utilisateurs:")
        typer.echo("-" * 50)
        for user in users:
            status = "🟢 Actif" if user.is_active else "🔴 Inactif"
            typer.echo(f"ID: {user.id} | {user.username} | {user.email} | {status}")
        
    finally:
        db.close()

@app.command()
def delete_user(
    username: str = typer.Argument(..., help="Nom d'utilisateur à supprimer"),
    force: bool = typer.Option(False, "--force", "-f", help="Forcer la suppression sans confirmation")
):
    """Supprimer un utilisateur"""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            typer.echo(f"❌ Utilisateur '{username}' introuvable", err=True)
            raise typer.Exit(1)
        
        if not force:
            if not typer.confirm(f"Êtes-vous sûr de vouloir supprimer l'utilisateur '{username}' ?"):
                typer.echo("Suppression annulée")
                return
        
        db.delete(user)
        db.commit()
        typer.echo(f"✅ Utilisateur '{username}' supprimé avec succès!")
        
    except Exception as e:
        typer.echo(f"❌ Erreur lors de la suppression: {str(e)}", err=True)
        raise typer.Exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    app()