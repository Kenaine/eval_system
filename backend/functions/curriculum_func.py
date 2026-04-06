from fastapi import HTTPException, status
from db.supabase_client import supabase
from schema.curriculum_schema import Curriculum

def getPrgmCurr(program_id: str):
    """Get all curricula for a specific program"""
    result = supabase.table("curriculum") \
        .select("*") \
        .eq("program_id", program_id) \
        .execute()
    
    return result.data

def addCurr(curr: Curriculum):
    """Add a new curriculum"""
    try:
        result = supabase.table("curriculum").insert({
            "name": curr.name,
            "program_id": curr.program_id
        }).execute()
        
        return {"message": "Curriculum added successfully", "data": result.data}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to add curriculum: {str(e)}"
        )

def deleteCurr(curr: Curriculum):
    """Delete a curriculum by name and program_id"""
    try:
        result = supabase.table("curriculum") \
            .delete() \
            .eq("name", curr.name) \
            .eq("program_id", curr.program_id) \
            .execute()
        
        return {"message": "Curriculum deleted successfully", "data": result.data}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete curriculum: {str(e)}"
        )

def archiveCurr(curr: Curriculum):
    """Archive a curriculum by setting archived column to true"""
    try:
        result = supabase.table("curriculum") \
            .update({"archived": True}) \
            .eq("name", curr.name) \
            .eq("program_id", curr.program_id) \
            .execute()
        
        return {"message": "Curriculum archived successfully", "data": result.data}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to archive curriculum: {str(e)}"
        )
