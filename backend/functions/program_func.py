from db.supabase_client import supabase

#--------------------------Supabase Functions--------------------------
def getPrograms():
    result = supabase.table("programs").select("program_id", "program_name", "program_specialization").execute()
    return result.data
